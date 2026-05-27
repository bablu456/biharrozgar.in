from __future__ import annotations

import hashlib
import logging
import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings.openrouter import OpenRouterEmbeddingService
from app.core.config import get_settings
from app.models.job import Job
from app.models.job_embedding import JobEmbedding
from app.models.profile import Profile
from app.services.ai_gateway import AIConfigurationError, AIProviderUnavailableError

logger = logging.getLogger(__name__)

MAX_EMBED_TEXT_CHARS = 3500


async def semantic_shortlist_jobs(
    session: AsyncSession,
    *,
    profile: Profile,
    candidate_jobs: Sequence[Job],
    top_k: int,
) -> list[Job]:
    if not candidate_jobs:
        return []

    settings = get_settings()
    service = OpenRouterEmbeddingService()
    dimensions = settings.openrouter_embedding_dimensions

    try:
        await _sync_candidate_job_embeddings(
            session=session,
            candidate_jobs=candidate_jobs,
            embedding_service=service,
            embedding_dimensions=dimensions,
            batch_size=settings.openrouter_embedding_batch_size,
        )
        query_text = build_profile_query_text(profile)
        query_embedding = (await service.embed_texts([query_text]))[0]
        if len(query_embedding) != dimensions:
            raise ValueError(
                f"Profile query embedding dimension mismatch: got={len(query_embedding)} expected={dimensions}"
            )

        candidate_job_ids = [job.id for job in candidate_jobs]
        statement = (
            select(JobEmbedding.job_id)
            .where(JobEmbedding.job_id.in_(candidate_job_ids))
            .order_by(JobEmbedding.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        result = await session.execute(statement)
        ranked_ids = list(result.scalars().all())

        if not ranked_ids:
            return list(candidate_jobs)[:top_k]

        by_id = {job.id: job for job in candidate_jobs}
        ranked_jobs = [by_id[job_id] for job_id in ranked_ids if job_id in by_id]
        return ranked_jobs or list(candidate_jobs)[:top_k]
    except (AIProviderUnavailableError, AIConfigurationError, ValueError):
        logger.exception("Semantic retrieval unavailable. Falling back to lexical pool ordering.")
        return list(candidate_jobs)[:top_k]
    except Exception:
        logger.exception("Semantic retrieval failed unexpectedly. Falling back to lexical pool ordering.")
        return list(candidate_jobs)[:top_k]


async def _sync_candidate_job_embeddings(
    session: AsyncSession,
    *,
    candidate_jobs: Sequence[Job],
    embedding_service: OpenRouterEmbeddingService,
    embedding_dimensions: int,
    batch_size: int,
) -> None:
    job_ids = [job.id for job in candidate_jobs]
    existing_result = await session.execute(
        select(JobEmbedding).where(JobEmbedding.job_id.in_(job_ids))
    )
    existing_by_job_id = {row.job_id: row for row in existing_result.scalars().all()}

    jobs_to_embed: list[Job] = []
    source_text_by_job_id: dict[uuid.UUID, str] = {}
    content_hash_by_job_id: dict[uuid.UUID, str] = {}
    embedding_model = embedding_service.settings.openrouter_embedding_model

    for job in candidate_jobs:
        source_text = build_job_embedding_text(job)
        content_hash = hashlib.sha256(source_text.encode("utf-8")).hexdigest()
        source_text_by_job_id[job.id] = source_text
        content_hash_by_job_id[job.id] = content_hash

        existing = existing_by_job_id.get(job.id)
        if existing is None:
            jobs_to_embed.append(job)
            continue

        if existing.content_hash != content_hash:
            jobs_to_embed.append(job)
            continue
        if existing.embedding_dimensions != embedding_dimensions:
            jobs_to_embed.append(job)
            continue
        if existing.embedding_model != embedding_model:
            jobs_to_embed.append(job)
            continue

    if not jobs_to_embed:
        return

    safe_batch_size = max(1, min(256, batch_size))
    for offset in range(0, len(jobs_to_embed), safe_batch_size):
        batch_jobs = jobs_to_embed[offset : offset + safe_batch_size]
        batch_texts = [source_text_by_job_id[job.id] for job in batch_jobs]
        batch_embeddings = await embedding_service.embed_texts(batch_texts)

        if len(batch_embeddings) != len(batch_jobs):
            raise ValueError(
                f"Embedding batch count mismatch: got={len(batch_embeddings)} expected={len(batch_jobs)}"
            )

        for job, vector in zip(batch_jobs, batch_embeddings):
            if len(vector) != embedding_dimensions:
                raise ValueError(
                    f"Job embedding dimension mismatch for job_id={job.id}: "
                    f"got={len(vector)} expected={embedding_dimensions}"
                )

            existing = existing_by_job_id.get(job.id)
            if existing is None:
                session.add(
                    JobEmbedding(
                        job_id=job.id,
                        embedding=vector,
                        embedding_model=embedding_model,
                        embedding_dimensions=embedding_dimensions,
                        content_hash=content_hash_by_job_id[job.id],
                        content_text=source_text_by_job_id[job.id],
                    )
                )
            else:
                existing.embedding = vector
                existing.embedding_model = embedding_model
                existing.embedding_dimensions = embedding_dimensions
                existing.content_hash = content_hash_by_job_id[job.id]
                existing.content_text = source_text_by_job_id[job.id]

    await session.flush()


def build_profile_query_text(profile: Profile) -> str:
    parts = [
        f"district: {profile.district or 'Not specified'}",
        f"experience_years: {profile.experience_years if profile.experience_years is not None else 'Not specified'}",
        f"skills: {', '.join(profile.skills or []) if profile.skills else 'Not specified'}",
    ]
    if profile.bio:
        parts.append(f"bio: {profile.bio}")

    return _trim_to_max_chars("\n".join(parts))


def build_job_embedding_text(job: Job) -> str:
    salary_line = f"{job.salary_min or ''}-{job.salary_max or ''} {job.salary_type or ''}".strip()
    parts = [
        f"title: {job.title}",
        f"category: {job.category}",
        f"job_type: {job.job_type}",
        f"district: {job.district}",
        f"city: {job.city or ''}",
        f"locality: {job.locality or ''}",
        f"salary: {salary_line or 'Not specified'}",
        f"fresher_friendly: {'yes' if job.is_fresher_friendly else 'no'}",
        f"description: {job.description}",
        f"requirements: {job.requirements or ''}",
    ]
    return _trim_to_max_chars("\n".join(parts))


def _trim_to_max_chars(text: str) -> str:
    cleaned = text.strip()
    if len(cleaned) <= MAX_EMBED_TEXT_CHARS:
        return cleaned
    return cleaned[: MAX_EMBED_TEXT_CHARS - 3].rstrip() + "..."
