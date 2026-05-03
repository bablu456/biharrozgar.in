from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.models.category import Category
from app.models.location import District
from pydantic import BaseModel

router = APIRouter()

class CategoryRead(BaseModel):
    id: int
    name_hi: str
    name_en: str
    icon: str | None
    slug: str

class DistrictRead(BaseModel):
    id: int
    name: str
    slug: str

@router.get("/categories", response_model=list[CategoryRead])
async def read_categories(
    db: AsyncSession = Depends(dependencies.get_db),
) -> Any:
    result = await db.execute(select(Category).order_by(Category.name_en))
    return result.scalars().all()

@router.get("/districts", response_model=list[DistrictRead])
async def read_districts(
    db: AsyncSession = Depends(dependencies.get_db),
) -> Any:
    result = await db.execute(select(District).order_by(District.name))
    return result.scalars().all()
