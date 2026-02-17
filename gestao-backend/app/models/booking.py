import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    space_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    item_codigos: Mapped[dict | None] = mapped_column(JSON, default=list)
    profile_slug: Mapped[str] = mapped_column(String, nullable=False)
    data_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    data_fim: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    tipo_uso: Mapped[str | None] = mapped_column(String, nullable=True)
    finalidade: Mapped[str | None] = mapped_column(String, nullable=True)
    numero_pessoas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pendente")
    checkin_itens: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    checkout_itens: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    checklist_entrada: Mapped[dict | None] = mapped_column(JSON, default=dict)
    checklist_saida: Mapped[dict | None] = mapped_column(JSON, default=dict)
    observacoes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
