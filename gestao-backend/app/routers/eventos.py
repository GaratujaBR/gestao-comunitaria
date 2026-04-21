from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.evento import Evento
from app.schemas.evento import EventoCreate, EventoUpdate, EventoResponse

router = APIRouter(prefix="/api/eventos", tags=["eventos"])


@router.get("", response_model=list[EventoResponse])
async def list_eventos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evento).order_by(Evento.data_inicio))
    return result.scalars().all()


@router.post("", response_model=EventoResponse, status_code=201)
async def create_evento(data: EventoCreate, db: AsyncSession = Depends(get_db)):
    evento = Evento(**data.model_dump())
    db.add(evento)
    await db.commit()
    await db.refresh(evento)
    return evento


@router.put("/{evento_id}", response_model=EventoResponse)
async def update_evento(evento_id: str, data: EventoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(evento, key, value)
    await db.commit()
    await db.refresh(evento)
    return evento


@router.delete("/{evento_id}", status_code=204)
async def delete_evento(evento_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento not found")
    await db.delete(evento)
    await db.commit()
