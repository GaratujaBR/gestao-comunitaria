from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.cota import Cota
from app.schemas.cota import CotaCreate, CotaUpdate, CotaResponse

router = APIRouter(prefix="/api/cotas", tags=["cotas"])


@router.get("", response_model=list[CotaResponse])
async def list_cotas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cota).order_by(Cota.numero))
    return result.scalars().all()


@router.get("/{slug}", response_model=CotaResponse)
async def get_cota(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cota).where(Cota.slug == slug))
    cota = result.scalar_one_or_none()
    if not cota:
        raise HTTPException(status_code=404, detail="Cota not found")
    return cota


@router.post("", response_model=CotaResponse, status_code=201)
async def create_cota(data: CotaCreate, db: AsyncSession = Depends(get_db)):
    cota = Cota(**data.model_dump())
    db.add(cota)
    await db.commit()
    await db.refresh(cota)
    return cota


@router.put("/{slug}", response_model=CotaResponse)
async def update_cota(slug: str, data: CotaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cota).where(Cota.slug == slug))
    cota = result.scalar_one_or_none()
    if not cota:
        raise HTTPException(status_code=404, detail="Cota not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cota, key, value)
    await db.commit()
    await db.refresh(cota)
    return cota


@router.delete("/{slug}", status_code=204)
async def delete_cota(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cota).where(Cota.slug == slug))
    cota = result.scalar_one_or_none()
    if not cota:
        raise HTTPException(status_code=404, detail="Cota not found")
    await db.delete(cota)
    await db.commit()
