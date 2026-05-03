# AI Package Layout

This package is intentionally reserved early so AI features can be added without
reshaping the backend architecture later.

- `providers/`: adapters for LLM vendors such as OpenAI or Anthropic.
- `embeddings/`: embedding model factories and batching helpers.
- `vectorstores/`: pgvector, Qdrant, Pinecone, or Weaviate integrations.
- `retrievers/`: lexical, semantic, or hybrid retrieval strategies.
- `rag/`: orchestration pipelines for ingestion, retrieval, and answer synthesis.
- `prompts/`: reusable prompt templates and prompt versioning.
