# RAG (Retrieval-Augmented Generation) Architecture & Setup

This document describes the RAG implementation for the "Rozgar Mitra" AI Chatbot on biharrozgar.in.

---

## 1. Overview
We have upgraded the static system-prompt-based chatbot to a dynamic RAG (Retrieval-Augmented Generation) system. The system embeds user queries, retrieves relevant job descriptions and platform knowledge from a PostgreSQL database powered by `pgvector`, and feeds them into the OpenRouter LLM context dynamically.

---

## 2. Dependencies
- **pgvector**: Already configured in the database layer.
- **sentence-transformers**: Added to `backend/pyproject.toml`.
  - Uses the **`all-MiniLM-L6-v2`** model, which generates 384-dimensional dense vectors.

---

## 3. Database Layer

A new SQLAlchemy model called `KnowledgeChunk` has been added.

- **File**: `backend/app/models/knowledge_chunk.py`
- **Fields**:
  - `id` (UUID): Primary key.
  - `content` (Text): The actual text content to retrieve.
  - `chunk_metadata` (JSON): Dynamically metadata (e.g. `{"type": "job", "job_id": "..."}` or `{"type": "faq"}`).
  - `embedding` (Vector(384)): The 384-dimension vector embedding.

Registering the model:
`KnowledgeChunk` is exported from `backend/app/models/__init__.py`.

---

## 4. Embedding Generation Service

- **File**: `backend/app/services/embedding_service.py`
- **Model**: `all-MiniLM-L6-v2` via `sentence-transformers`.
- **Functions**:
  - `async def generate_embedding(text: str) -> list[float]`: Safely offloads synchronous embedding generation to an asynchronous executor thread (`asyncio.to_thread`) to ensure the FastAPI event loop is never blocked.
  - `async def ingest_job_to_vector_db(job_id: uuid.UUID, db: AsyncSession)`: Fetches a newly created job, builds a unified search string (Title, Category, District, Description, Requirements), embeds it, and stores it in the `knowledge_chunks` table.

---

## 5. RAG Retrieval Service

- **File**: `backend/app/services/retrieval.py`
- **Function**:
  - `async def get_relevant_context(user_query: str, db: AsyncSession, top_k: int = 3) -> str`
    - Computes the embedding of the user's latest query.
    - Runs a cosine distance similarity query using the pgvector `<=>` operator.
    - Formats the retrieved text chunks into a contextual payload string.

---

## 6. AI Chat Service Integration

- **File**: `backend/app/services/ai_chat.py`
- **Endpoint File**: `backend/app/api/v1/endpoints/chat.py`
- **Flow**:
  1. The chat endpoint takes `DatabaseSession` as a dependency.
  2. The endpoint passes the database session to `OpenRouterAIService.generate_reply()`.
  3. `generate_reply` pulls the latest user message, calls `get_relevant_context(latest_message, db)`, and appends it to the system instructions.
  4. The LLM receives the enriched prompt and answers the user based on the retrieved context.
