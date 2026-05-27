from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, field_validator
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.retrievers.semantic_job_retriever import semantic_shortlist_jobs
from app.db.session import AsyncSessionFactory
from app.models.enums import JobStatus
from app.models.job import Job
from app.models.profile import Profile
from app.models.recommendation import JobRecommendation
from app.services.ai_gateway import AIProviderUnavailableError, AIResponseFormatError, OpenRouterGateway

logger = logging.getLogger(__name__)

MODEL_CANDIDATES: tuple[str, ...] = (
    "google/gemini-2.5-pro-exp-03-25:free",
    "meta-llama/llama-3-70b-instruct",
    "nvidia/nemotron-3-super-120b-a12b:free",
)
MAX_JOB_POOL = 80
MIN_DISTRICT_POOL = 15
SEMANTIC_SHORTLIST_SIZE = 30
MIN_RECOMMENDATIONS = 3
MAX_RECOMMENDATIONS = 5


class LLMJobRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: str = Field(min_length=1, max_length=80)
    match_score: int = Field(ge=0, le=100)
    ai_reason: str = Field(min_length=3, max_length=320)

    @field_validator("ai_reason")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        collapsed = re.sub(r"\s+", " ", value).strip()
        if not collapsed:
            raise ValueError("ai_reason must not be blank.")
        return collapsed


LLM_RECOMMENDATION_ADAPTER = TypeAdapter(list[LLMJobRecommendation])


async def run_ai_job_matching(
    user_id: uuid.UUID | str,
    db: AsyncSession,
) -> None:
    user_uuid = _to_uuid(user_id)
    profile = await _get_profile(db, user_uuid)
    if profile is None:
        logger.warning("AI matcher skipped: profile not found for user_id=%s", user_uuid)
        return

    jobs = await _get_active_jobs(db, district=profile.district)
    if not jobs:
        await _replace_recommendations(db, user_uuid, [])
        logger.info("AI matcher cleared recommendations: no active jobs for user_id=%s", user_uuid)
        return

    shortlisted_jobs = await semantic_shortlist_jobs(
        db,
        profile=profile,
        candidate_jobs=jobs,
        top_k=min(SEMANTIC_SHORTLIST_SIZE, len(jobs)),
    )
    if not shortlisted_jobs:
        shortlisted_jobs = jobs[:SEMANTIC_SHORTLIST_SIZE]

    parsed_recommendations = await _request_llm_recommendations(
        profile=profile,
        jobs=shortlisted_jobs,
    )
    normalized_recommendations = _normalize_recommendations(parsed_recommendations, shortlisted_jobs)
    await _replace_recommendations(db, user_uuid, normalized_recommendations)

    logger.info(
        "AI matcher saved %s recommendations for user_id=%s",
        len(normalized_recommendations),
        user_uuid,
    )


async def run_ai_job_matching_background(user_id: uuid.UUID | str) -> None:
    async with AsyncSessionFactory() as session:
        try:
            await run_ai_job_matching(user_id=user_id, db=session)
        except (AIProviderUnavailableError, AIResponseFormatError, ValueError):
            await session.rollback()
            logger.exception("AI job matching failed validation/provider checks for user_id=%s", user_id)
        except Exception:
            await session.rollback()
            logger.exception("AI job matching failed for user_id=%s", user_id)


async def _get_profile(db: AsyncSession, user_id: uuid.UUID) -> Profile | None:
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    return result.scalar_one_or_none()


async def _get_active_jobs(db: AsyncSession, *, district: str | None) -> list[Job]:
    now_utc = datetime.now(timezone.utc)
    base_filters = (
        Job.status == JobStatus.APPROVED,
        or_(Job.expires_at.is_(None), Job.expires_at > now_utc),
    )

    jobs_by_district: list[Job] = []
    if district:
        district_statement = (
            select(Job)
            .where(*base_filters, Job.district == district)
            .order_by(Job.created_at.desc())
            .limit(MAX_JOB_POOL)
        )
        district_result = await db.execute(district_statement)
        jobs_by_district = list(district_result.scalars().all())
        if len(jobs_by_district) >= MIN_DISTRICT_POOL:
            return jobs_by_district[:MAX_JOB_POOL]

    all_statement = (
        select(Job)
        .where(*base_filters)
        .order_by(Job.created_at.desc())
        .limit(MAX_JOB_POOL)
    )
    all_result = await db.execute(all_statement)
    statewide_jobs = list(all_result.scalars().all())

    if not jobs_by_district:
        return statewide_jobs

    deduped: list[Job] = []
    seen: set[uuid.UUID] = set()
    for job in (*jobs_by_district, *statewide_jobs):
        if job.id in seen:
            continue
        deduped.append(job)
        seen.add(job.id)
        if len(deduped) >= MAX_JOB_POOL:
            break

    return deduped


async def _request_llm_recommendations(
    profile: Profile,
    jobs: list[Job],
) -> list[LLMJobRecommendation]:
    gateway = OpenRouterGateway()
    payload_messages = _build_prompt_messages(profile=profile, jobs=jobs)

    recommendations = await gateway.complete_json(
        messages=payload_messages,
        model_ids=MODEL_CANDIDATES,
        response_model=list[LLMJobRecommendation],
        temperature=0.1,
    )
    if not recommendations:
        raise ValueError("LLM returned zero recommendations.")
    return recommendations


def _build_prompt_messages(profile: Profile, jobs: list[Job]) -> list[dict[str, str]]:
    profile_payload = {
        "user_id": str(profile.id),
        "skills": profile.skills or [],
        "experience_years": profile.experience_years,
        "district": profile.district,
        "bio": _trim_text(profile.bio, 800),
    }
    jobs_payload = [_serialize_job(job) for job in jobs]
    schema_hint = LLM_RECOMMENDATION_ADAPTER.json_schema()

    system_prompt = (
        "You are an expert technical recruiter for biharrozgar.in. "
        "Analyze candidate-job fit and return ONLY valid JSON."
    )
    user_prompt = (
        "Candidate profile JSON:\n"
        f"{json.dumps(profile_payload, ensure_ascii=False)}\n\n"
        "Active jobs JSON array:\n"
        f"{json.dumps(jobs_payload, ensure_ascii=False)}\n\n"
        "Required response schema JSON:\n"
        f"{json.dumps(schema_hint, ensure_ascii=False)}\n\n"
        "Return a strict JSON array with 3 to 5 best matches, sorted by highest fit first.\n"
        "Rules:\n"
        "- Use only job_id values from the provided jobs.\n"
        "- ai_reason must be a single concise line.\n"
        "- Output only JSON."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _serialize_job(job: Job) -> dict[str, object]:
    return {
        "job_id": str(job.id),
        "title": job.title,
        "category": job.category,
        "job_type": _enum_value(job.job_type),
        "district": job.district,
        "city": job.city,
        "locality": job.locality,
        "description": _trim_text(job.description, 500),
        "requirements": _trim_text(job.requirements, 500),
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_type": _enum_value(job.salary_type),
        "is_fresher_friendly": bool(job.is_fresher_friendly),
    }


def _enum_value(value: object) -> object:
    return value.value if hasattr(value, "value") else value


def _normalize_recommendations(
    parsed_array: list[LLMJobRecommendation],
    jobs: list[Job],
) -> list[dict[str, object]]:
    job_ids: dict[str, uuid.UUID] = {}
    for job in jobs:
        job_id_str = str(job.id)
        job_ids[job_id_str] = job.id
        job_ids[job_id_str.lower()] = job.id

    normalized: list[dict[str, object]] = []
    seen: set[uuid.UUID] = set()

    for item in parsed_array:
        job_id = job_ids.get(item.job_id.strip()) or job_ids.get(item.job_id.strip().lower())
        if job_id is None or job_id in seen:
            continue

        normalized.append(
            {
                "job_id": job_id,
                "match_score": item.match_score,
                "ai_reason": item.ai_reason,
            }
        )
        seen.add(job_id)

        if len(normalized) >= MAX_RECOMMENDATIONS:
            break

    if len(normalized) < MIN_RECOMMENDATIONS:
        logger.warning(
            "AI matcher returned fewer than %s recommendations (%s).",
            MIN_RECOMMENDATIONS,
            len(normalized),
        )

    return normalized


def _trim_text(value: str | None, max_chars: int) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) <= max_chars:
        return cleaned
    if max_chars <= 3:
        return cleaned[:max_chars]
    return cleaned[: max_chars - 3].rstrip() + "..."


async def _replace_recommendations(
    db: AsyncSession,
    user_id: uuid.UUID,
    recommendations: list[dict[str, object]],
) -> None:
    await db.execute(delete(JobRecommendation).where(JobRecommendation.user_id == user_id))

    for recommendation in recommendations:
        db.add(
            JobRecommendation(
                user_id=user_id,
                job_id=recommendation["job_id"],
                match_score=recommendation["match_score"],
                ai_reason=recommendation["ai_reason"],
            )
        )

    await db.commit()


def _to_uuid(value: uuid.UUID | str) -> uuid.UUID:
    if isinstance(value, uuid.UUID):
        return value
    return uuid.UUID(str(value))
