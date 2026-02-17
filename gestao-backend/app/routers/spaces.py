from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.space import Space
from app.schemas.space import SpaceCreate, SpaceUpdate, SpaceResponse

router = APIRouter(prefix="/api/spaces", tags=["spaces"])


@router.get("", response_model=list[SpaceResponse])
async def list_spaces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Space).order_by(Space.nome))
    return result.scalars().all()


@router.get("/{slug}", response_model=SpaceResponse)
async def get_space(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Space).where(Space.slug == slug))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space


@router.post("", response_model=SpaceResponse, status_code=201)
async def create_space(data: SpaceCreate, db: AsyncSession = Depends(get_db)):
    space = Space(**data.model_dump())
    db.add(space)
    await db.commit()
    await db.refresh(space)
    return space


@router.put("/{slug}", response_model=SpaceResponse)
async def update_space(slug: str, data: SpaceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Space).where(Space.slug == slug))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(space, key, value)
    await db.commit()
    await db.refresh(space)
    return space


@router.delete("/{slug}", status_code=204)
async def delete_space(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Space).where(Space.slug == slug))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    await db.delete(space)
    await db.commit()
