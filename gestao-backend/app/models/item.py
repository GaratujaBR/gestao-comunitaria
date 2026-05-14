import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Integer, Float, DateTime, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    codigo: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    space_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    container_especifico: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    tipo: Mapped[str] = mapped_column(String, default="comum")
    estado: Mapped[str] = mapped_column(String, default="bom")
    manual_cuidados: Mapped[str | None] = mapped_column(String, nullable=True)
    ciclo_manutencao: Mapped[str | None] = mapped_column(String, nullable=True)
    ultima_manutencao: Mapped[date | None] = mapped_column(Date, nullable=True)
    proxima_manutencao: Mapped[date | None] = mapped_column(Date, nullable=True)
    vezes_usado: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[list | None] = mapped_column(JSON, default=list)
    fotos: Mapped[list | None] = mapped_column(JSON, default=list)
    qr_code_url: Mapped[str | None] = mapped_column(String, nullable=True)
    quantidade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valor_estimado: Mapped[float | None] = mapped_column(Float, nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String, nullable=True)
    disponibilidade: Mapped[str | None] = mapped_column(String, nullable=True)
    origem: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
