from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_chunk import KnowledgeChunk
from app.services.embedding_service import generate_embedding

async def get_relevant_context(user_query: str, db: AsyncSession, top_k: int = 3) -> str:
    """
    Retrieves the most relevant knowledge chunks based on the user's query.
    """
    query_embedding = await generate_embedding(user_query)

    # Use cosine distance (<=>) for vector similarity search
    # order_by using the pgvector distance operator
    stmt = (
        select(KnowledgeChunk)
        .order_by(KnowledgeChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    result = await db.execute(stmt)
    chunks = result.scalars().all()

    if not chunks:
        return ""

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        # We can add metadata if useful
        meta_type = chunk.chunk_metadata.get("type", "unknown") if chunk.chunk_metadata else "unknown"
        context_parts.append(f"[Context {i} - Type: {meta_type}]\n{chunk.content}")

    return "\n\n".join(context_parts)
