import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Log(Base):
    __tablename__ = "logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_codigo: Mapped[str | None] = mapped_column(String, nullable=True)
    acao: Mapped[str] = mapped_column(String, nullable=False)
    profile_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    booking_id: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    local_uso: Mapped[str | None] = mapped_column(String, nullable=True)
    condicao_saida: Mapped[str | None] = mapped_column(String, nullable=True)
    condicao_retorno: Mapped[str | None] = mapped_column(String, nullable=True)
    descricao_incidente: Mapped[str | None] = mapped_column(String, nullable=True)
    fotos_evidencia: Mapped[dict | None] = mapped_column(JSON, default=list)
    clima: Mapped[str | None] = mapped_column(String, nullable=True)
    sazonalidade: Mapped[str | None] = mapped_column(String, nullable=True)
