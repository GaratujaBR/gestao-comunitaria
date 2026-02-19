import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Prestador(Base):
    __tablename__ = "prestadores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nome: Mapped[str] = mapped_column(String, nullable=False)
    telefone: Mapped[str] = mapped_column(String, nullable=False)
    especialidade: Mapped[str | None] = mapped_column(String, nullable=True)
    empresa: Mapped[str | None] = mapped_column(String, nullable=True)
    notas: Mapped[str | None] = mapped_column(String, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
