import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Chamado(Base):
    __tablename__ = "chamados"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    estrutura: Mapped[str] = mapped_column(String, nullable=False)
    area: Mapped[str | None] = mapped_column(String, nullable=True)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    prioridade: Mapped[str] = mapped_column(String, default="normal")
    tipo: Mapped[str] = mapped_column(String, default="corretiva")
    prestador_id: Mapped[str | None] = mapped_column(String, nullable=True)
    prestador_nome: Mapped[str | None] = mapped_column(String, nullable=True)
    prestador_telefone: Mapped[str | None] = mapped_column(String, nullable=True)
    solicitante: Mapped[str | None] = mapped_column(String, nullable=True)
    mensagem_enviada: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="aberto")
    resolucao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
