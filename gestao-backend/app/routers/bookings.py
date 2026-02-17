from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingResponse])
async def list_bookings(
    status: str | None = Query(None),
    profile_slug: str | None = Query(None),
    space_slug: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).order_by(Booking.data_inicio.desc())
    if status:
        query = query.where(Booking.status == status)
    if profile_slug:
        query = query.where(Booking.profile_slug == profile_slug)
    if space_slug:
        query = query.where(Booking.space_slug == space_slug)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    if data.space_slug:
        overlap_query = select(Booking).where(
            and_(
                Booking.space_slug == data.space_slug,
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
    booking = Booking(**data.model_dump())
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, data: BookingUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, key, value)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    await db.delete(booking)
    await db.commit()
