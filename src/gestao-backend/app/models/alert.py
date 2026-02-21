import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tipo: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    mensagem: Mapped[str | None] = mapped_column(String, nullable=True)
    dados_json: Mapped[dict | None] = mapped_column(JSON, default=dict)
    lido: Mapped[bool] = mapped_column(Boolean, default=False)
    data_acao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
