import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    tipo: Mapped[str | None] = mapped_column(String, nullable=True)
    capacidade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    area_m2: Mapped[float | None] = mapped_column(Float, nullable=True)
    caracteristicas: Mapped[dict | None] = mapped_column(JSON, default=dict)
    regras_uso: Mapped[str | None] = mapped_column(String, nullable=True)
    instrucoes_acesso: Mapped[str | None] = mapped_column(String, nullable=True)
    fotos: Mapped[dict | None] = mapped_column(JSON, default=list)
    responsavel_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ativo")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
