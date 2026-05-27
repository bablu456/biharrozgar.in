from __future__ import annotations

from typing import List

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model_id: str = "nvidia/nemotron-3-super-120b-a12b:free"
