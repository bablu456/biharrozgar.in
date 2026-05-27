from __future__ import annotations

from collections.abc import Sequence

from app.core.config import get_settings
from app.services.ai_gateway import OpenRouterGateway


class OpenRouterEmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.gateway = OpenRouterGateway()

    async def embed_texts(self, texts: Sequence[str]) -> list[list[float]]:
        model_ids = self._candidate_model_ids()
        return await self.gateway.embed_texts(
            texts=[text for text in texts],
            model_ids=model_ids,
            dimensions=self.settings.openrouter_embedding_dimensions,
        )

    def _candidate_model_ids(self) -> tuple[str, ...]:
        deduped: list[str] = []
        for candidate in (
            self.settings.openrouter_embedding_model,
            *self.settings.openrouter_embedding_fallback_models,
        ):
            cleaned = candidate.strip()
            if cleaned and cleaned not in deduped:
                deduped.append(cleaned)
        return tuple(deduped)
