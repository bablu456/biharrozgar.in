from __future__ import annotations

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

class KnowledgeChunk(TimestampMixin, Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_metadata: Mapped[dict] = mapped_column(JSON, nullable=True)
    # Using 384 dimensions for all-MiniLM-L6-v2
    embedding: Mapped[list[float]] = mapped_column(Vector(384), nullable=False)
