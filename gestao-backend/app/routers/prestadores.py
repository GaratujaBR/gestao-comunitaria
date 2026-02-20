from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.prestador import Prestador
from app.schemas.prestador import PrestadorCreate, PrestadorUpdate, PrestadorResponse

router = APIRouter(prefix="/api/prestadores", tags=["prestadores"])


@router.get("", response_model=list[PrestadorResponse])
async def list_prestadores(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prestador).order_by(Prestador.nome))
    return result.scalars().all()


@router.get("/{prestador_id}", response_model=PrestadorResponse)
async def get_prestador(prestador_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prestador).where(Prestador.id == prestador_id))
    prestador = result.scalar_one_or_none()
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador not found")
    return prestador


@router.post("", response_model=PrestadorResponse, status_code=201)
async def create_prestador(data: PrestadorCreate, db: AsyncSession = Depends(get_db)):
    prestador = Prestador(**data.model_dump())
    db.add(prestador)
    await db.commit()
    await db.refresh(prestador)
    return prestador


@router.put("/{prestador_id}", response_model=PrestadorResponse)
async def update_prestador(prestador_id: str, data: PrestadorUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prestador).where(Prestador.id == prestador_id))
    prestador = result.scalar_one_or_none()
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prestador, key, value)
    await db.commit()
    await db.refresh(prestador)
    return prestador


@router.delete("/{prestador_id}", status_code=204)
async def delete_prestador(prestador_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prestador).where(Prestador.id == prestador_id))
    prestador = result.scalar_one_or_none()
    if not prestador:
        raise HTTPException(status_code=404, detail="Prestador not found")
    await db.delete(prestador)
    await db.commit()
