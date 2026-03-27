import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Enquete(Base):
    __tablename__ = "enquetes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str] = mapped_column(String, default="decisao")
    opcoes: Mapped[list] = mapped_column(JSON, nullable=False)
    votos: Mapped[dict] = mapped_column(JSON, default=dict)
    votantes: Mapped[dict] = mapped_column(JSON, default=dict)
    total_votos: Mapped[int] = mapped_column(Integer, default=0)
    criador: Mapped[str | None] = mapped_column(String, nullable=True)
    multipla_escolha: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="aberta")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
