import asyncio
import uuid
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sentence_transformers import SentenceTransformer

from app.models.job import Job
from app.models.knowledge_chunk import KnowledgeChunk

logger = logging.getLogger(__name__)

# Initialize model lazily to avoid loading it on every import
_model: SentenceTransformer | None = None

def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        # all-MiniLM-L6-v2 produces 384 dimensional embeddings
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def _generate_embedding_sync(text: str) -> list[float]:
    model = _get_model()
    # SentenceTransformer returns numpy array or tensor, convert to list of floats
    embedding = model.encode(text)
    return embedding.tolist()

async def generate_embedding(text: str) -> list[float]:
    """Generate embedding without blocking the async event loop."""
    return await asyncio.to_thread(_generate_embedding_sync, text)

async def ingest_job_to_vector_db(job_id: uuid.UUID, db: AsyncSession) -> None:
    """
    Fetches a job and converts its description and title into an embedding,
    then stores it in the KnowledgeChunk table.
    """
    job = await db.get(Job, job_id)
    if not job:
        logger.warning(f"Job {job_id} not found for vector ingestion.")
        return

    content_text = f"Title: {job.title}\nCategory: {job.category}\nDistrict: {job.district}\nDescription: {job.description}"
    if job.requirements:
        content_text += f"\nRequirements: {job.requirements}"

    embedding = await generate_embedding(content_text)

    chunk = KnowledgeChunk(
        content=content_text,
        chunk_metadata={"type": "job", "job_id": str(job.id)},
        embedding=embedding
    )
    db.add(chunk)
    await db.commit()
    logger.info(f"Ingested Job {job_id} into vector db.")
