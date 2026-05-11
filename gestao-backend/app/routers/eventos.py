from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.evento import Evento
from app.models.booking import Booking
from app.models.alert import Alert
from app.models.log import Log
from app.schemas.evento import EventoCreate, EventoUpdate, EventoResponse

router = APIRouter(prefix="/api/eventos", tags=["eventos"])


@router.get("", response_model=list[EventoResponse])
async def list_eventos(
    publico: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Evento).order_by(Evento.data_inicio)
    if publico is not None:
        query = query.where(Evento.publico == publico)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=EventoResponse, status_code=201)
async def create_evento(data: EventoCreate, db: AsyncSession = Depends(get_db)):
    evento = Evento(**data.model_dump())
    db.add(evento)

    if data.local_slug:
        overlap_query = select(Booking).where(
            and_(
                Booking.space_slug == data.local_slug,
                Booking.status.in_(["pendente", "confirmada", "em_andamento"]),
                Booking.data_inicio < data.data_fim,
                Booking.data_fim > data.data_inicio,
            )
        )
        result = await db.execute(overlap_query)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=409,
                detail="Conflito de agenda: este espaco ja esta reservado neste periodo",
            )

        await db.flush()
        await db.refresh(evento)

        booking = Booking(
            space_slug=data.local_slug,
            profile_slug=data.criador_slug or "sistema",
            data_inicio=data.data_inicio,
            data_fim=data.data_fim,
            finalidade=data.titulo,
            status="confirmada",
            evento_id=evento.id,
        )
        db.add(booking)
        await db.flush()
        await db.refresh(booking)
        db.add(
            Alert(
                tipo="reserva",
                titulo=f"Reserva automática: {data.local_slug}",
                mensagem=f"Evento '{data.titulo}' — {data.data_inicio.strftime('%d/%m/%Y')} a {data.data_fim.strftime('%d/%m/%Y')}",
            )
        )
        db.add(
            Log(
                acao="reserva_criada",
                profile_slug=data.criador_slug or "sistema",
                booking_id=booking.id,
                local_uso=data.local_slug,
            )
        )

    await db.commit()
    await db.refresh(evento)
    return evento


@router.put("/{evento_id}", response_model=EventoResponse)
async def update_evento(
    evento_id: str, data: EventoUpdate, db: AsyncSession = Depends(get_db)
):
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

    booking_result = await db.execute(
        select(Booking).where(Booking.evento_id == evento_id)
    )
    booking = booking_result.scalar_one_or_none()
    if booking:
        await db.delete(booking)

    await db.delete(evento)
    await db.commit()
