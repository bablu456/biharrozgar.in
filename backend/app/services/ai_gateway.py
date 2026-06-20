from __future__ import annotations

import asyncio
import json
import random
import re
from collections.abc import Sequence
from typing import Any, TypeVar

import httpx
from pydantic import TypeAdapter, ValidationError

from app.core.config import get_settings

T = TypeVar("T")

TRANSIENT_STATUS_CODES = {408, 425, 429, 500, 502, 503, 504}
UNAVAILABLE_STATUS_CODES = {404}


class AIGatewayError(RuntimeError):
    """Base error for gateway-level failures."""


class AIConfigurationError(AIGatewayError):
    """Raised when gateway configuration is invalid."""


class AIProviderUnavailableError(AIGatewayError):
    """Raised when all candidate providers/models are unavailable."""


class AIResponseFormatError(AIGatewayError):
    """Raised when model output is not valid for the expected schema."""


class OpenRouterGateway:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.openrouter_api_key.get_secret_value().strip()
        self.chat_completions_url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"
        self.embeddings_url = f"{settings.openrouter_base_url.rstrip('/')}/embeddings"
        self.http_referer = settings.openrouter_http_referer
        self.app_title = settings.openrouter_app_title
        self.timeout_seconds = settings.openrouter_timeout_seconds
        self.max_retries = settings.openrouter_max_retries
        self.retry_backoff_seconds = settings.openrouter_retry_backoff_seconds

    async def complete_text(
        self,
        *,
        messages: Sequence[dict[str, str]],
        model_ids: Sequence[str],
        temperature: float | None = None,
        max_tokens: int | None = None,
        extra_payload: dict[str, Any] | None = None,
    ) -> str:
        if not self.api_key:
            raise AIConfigurationError(
                "OPENROUTER_API_KEY is not configured. Add it to backend/.env or "
                "the backend environment, then restart the server."
            )

        candidate_model_ids = _deduplicate_models(model_ids)
        if not candidate_model_ids:
            raise AIConfigurationError("At least one model id is required.")

        headers = self._build_headers()
        payload_messages = [dict(item) for item in messages]
        unavailable_details: list[str] = []

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for model_id in candidate_model_ids:
                payload: dict[str, Any] = {
                    "model": model_id,
                    "messages": payload_messages,
                }
                if temperature is not None:
                    payload["temperature"] = temperature
                if max_tokens is not None:
                    payload["max_tokens"] = max_tokens
                if extra_payload:
                    payload.update(extra_payload)

                try:
                    response = await self._post_with_retries(
                        client=client,
                        url=self.chat_completions_url,
                        headers=headers,
                        payload=payload,
                        model_id=model_id,
                    )
                except AIProviderUnavailableError as exc:
                    unavailable_details.append(str(exc))
                    continue

                data = response.json()
                content = _extract_message_content(data)
                if content:
                    return content

                unavailable_details.append(f"{model_id}: empty completion content")

        detail_message = (
            "All configured AI models are unavailable or returned invalid output. "
            + " | ".join(unavailable_details)
        )
        raise AIProviderUnavailableError(detail_message)

    async def complete_chat(
        self,
        *,
        messages: Sequence[dict[str, Any]],
        model_ids: Sequence[str],
        temperature: float | None = None,
        max_tokens: int | None = None,
        tools: list[dict[str, Any]] | None = None,
        extra_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Returns the complete message dict, supporting tool_calls."""
        if not self.api_key:
            raise AIConfigurationError(
                "OPENROUTER_API_KEY is not configured. Add it to backend/.env or "
                "the backend environment, then restart the server."
            )

        candidate_model_ids = _deduplicate_models(model_ids)
        if not candidate_model_ids:
            raise AIConfigurationError("At least one model id is required.")

        headers = self._build_headers()
        payload_messages = [dict(item) for item in messages]
        unavailable_details: list[str] = []

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for model_id in candidate_model_ids:
                payload: dict[str, Any] = {
                    "model": model_id,
                    "messages": payload_messages,
                }
                if temperature is not None:
                    payload["temperature"] = temperature
                if max_tokens is not None:
                    payload["max_tokens"] = max_tokens
                if tools is not None:
                    payload["tools"] = tools
                if extra_payload:
                    payload.update(extra_payload)

                try:
                    response = await self._post_with_retries(
                        client=client,
                        url=self.chat_completions_url,
                        headers=headers,
                        payload=payload,
                        model_id=model_id,
                    )
                except AIProviderUnavailableError as exc:
                    unavailable_details.append(str(exc))
                    continue

                data = response.json()
                try:
                    message = data["choices"][0]["message"]
                    return message
                except (KeyError, IndexError, TypeError):
                    unavailable_details.append(f"{model_id}: invalid completion message structure")

        detail_message = (
            "All configured AI models are unavailable or returned invalid output. "
            + " | ".join(unavailable_details)
        )
        raise AIProviderUnavailableError(detail_message)


    async def embed_texts(
        self,
        *,
        texts: Sequence[str],
        model_ids: Sequence[str],
        dimensions: int | None = None,
        input_type: str | None = None,
    ) -> list[list[float]]:
        if not self.api_key:
            raise AIConfigurationError(
                "OPENROUTER_API_KEY is not configured. Add it to backend/.env or "
                "the backend environment, then restart the server."
            )
        if not texts:
            return []

        candidate_model_ids = _deduplicate_models(model_ids)
        if not candidate_model_ids:
            raise AIConfigurationError("At least one embedding model id is required.")

        headers = self._build_headers()
        payload_texts = [text for text in texts]
        unavailable_details: list[str] = []

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for model_id in candidate_model_ids:
                payload: dict[str, Any] = {
                    "model": model_id,
                    "input": payload_texts,
                }
                if dimensions is not None:
                    payload["dimensions"] = dimensions
                if input_type is not None:
                    payload["input_type"] = input_type

                try:
                    response = await self._post_with_retries(
                        client=client,
                        url=self.embeddings_url,
                        headers=headers,
                        payload=payload,
                        model_id=model_id,
                    )
                except AIProviderUnavailableError as exc:
                    unavailable_details.append(str(exc))
                    continue

                embeddings = _extract_embeddings(response.json(), expected_count=len(payload_texts))
                if embeddings:
                    return embeddings

                unavailable_details.append(f"{model_id}: invalid embeddings payload")

        raise AIProviderUnavailableError(
            "All configured embedding models are unavailable or returned invalid output. "
            + " | ".join(unavailable_details)
        )

    async def complete_json(
        self,
        *,
        messages: Sequence[dict[str, str]],
        model_ids: Sequence[str],
        response_model: type[T] | Any,
        temperature: float = 0.0,
        max_tokens: int | None = None,
    ) -> T:
        json_guardrail = {
            "role": "system",
            "content": (
                "Return only valid JSON. Do not include markdown fences, commentary, "
                "or any text outside JSON."
            ),
        }
        guarded_messages = [json_guardrail, *[dict(item) for item in messages]]

        raw_text = await self.complete_text(
            messages=guarded_messages,
            model_ids=model_ids,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        parsed_json = _extract_json_payload(raw_text)
        adapter: TypeAdapter[T] = TypeAdapter(response_model)
        try:
            return adapter.validate_python(parsed_json)
        except ValidationError as exc:
            raise AIResponseFormatError(
                "AI JSON response failed schema validation."
            ) from exc

    async def _post_with_retries(
        self,
        *,
        client: httpx.AsyncClient,
        url: str,
        headers: dict[str, str],
        payload: dict[str, Any],
        model_id: str,
    ) -> httpx.Response:
        max_attempts = self.max_retries + 1
        for attempt in range(1, max_attempts + 1):
            try:
                response = await client.post(url, headers=headers, json=payload)
            except httpx.HTTPError as exc:
                if attempt >= max_attempts:
                    raise AIProviderUnavailableError(
                        f"{model_id}: network error {exc.__class__.__name__}"
                    ) from exc
                await self._retry_sleep(attempt)
                continue

            if response.status_code in UNAVAILABLE_STATUS_CODES:
                raise AIProviderUnavailableError(
                    f"{model_id}: {response.status_code} {_extract_provider_error(response)}"
                )

            if response.status_code in TRANSIENT_STATUS_CODES:
                if attempt >= max_attempts:
                    raise AIProviderUnavailableError(
                        f"{model_id}: {response.status_code} {_extract_provider_error(response)}"
                    )
                await self._retry_sleep(attempt)
                continue

            response.raise_for_status()
            return response

        raise AIProviderUnavailableError(f"{model_id}: exhausted retries")

    async def _retry_sleep(self, attempt: int) -> None:
        delay = (self.retry_backoff_seconds * (2 ** (attempt - 1))) + random.uniform(0.0, 0.25)
        await asyncio.sleep(delay)

    def _build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": self.http_referer,
            "X-Title": self.app_title,
            "Content-Type": "application/json",
        }


def _deduplicate_models(model_ids: Sequence[str]) -> list[str]:
    deduped: list[str] = []
    for model_id in model_ids:
        cleaned = model_id.strip()
        if cleaned and cleaned not in deduped:
            deduped.append(cleaned)
    return deduped


def _extract_provider_error(response: httpx.Response) -> str:
    default_detail = f"HTTP {response.status_code}"
    try:
        body = response.json()
    except ValueError:
        return default_detail

    if not isinstance(body, dict):
        return default_detail

    error = body.get("error")
    if not isinstance(error, dict):
        return default_detail

    message = error.get("message")
    if isinstance(message, str) and message.strip():
        return message.strip()

    return default_detail


def _extract_message_content(response_json: dict[str, Any]) -> str:
    try:
        content = response_json["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    text_parts.append(text)
        return "".join(text_parts).strip()

    return ""


def _extract_embeddings(response_json: dict[str, Any], *, expected_count: int) -> list[list[float]]:
    data = response_json.get("data")
    if not isinstance(data, list) or len(data) != expected_count:
        return []

    ordered: list[list[float] | None] = [None] * expected_count
    for item in data:
        if not isinstance(item, dict):
            return []
        index = item.get("index")
        embedding = item.get("embedding")
        if not isinstance(index, int) or index < 0 or index >= expected_count:
            return []
        if not isinstance(embedding, list) or not embedding:
            return []

        vector: list[float] = []
        for value in embedding:
            if not isinstance(value, (int, float)):
                return []
            vector.append(float(value))
        ordered[index] = vector

    if any(vector is None for vector in ordered):
        return []

    return [vector for vector in ordered if vector is not None]


def _extract_json_payload(raw_text: str) -> Any:
    candidate_strings = [raw_text.strip()]

    code_block_matches = re.findall(
        r"```(?:json)?\s*([\s\S]*?)\s*```",
        raw_text,
        flags=re.IGNORECASE,
    )
    candidate_strings.extend(code_block_matches)

    left_square = raw_text.find("[")
    right_square = raw_text.rfind("]")
    if left_square != -1 and right_square != -1 and right_square > left_square:
        candidate_strings.append(raw_text[left_square : right_square + 1])

    left_curly = raw_text.find("{")
    right_curly = raw_text.rfind("}")
    if left_curly != -1 and right_curly != -1 and right_curly > left_curly:
        candidate_strings.append(raw_text[left_curly : right_curly + 1])

    for candidate in candidate_strings:
        try:
            return json.loads(candidate)
        except (TypeError, json.JSONDecodeError):
            continue

    raise AIResponseFormatError("AI response did not contain valid JSON.")
