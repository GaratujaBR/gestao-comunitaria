import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    data_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    data_fim: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    tipo: Mapped[str | None] = mapped_column(String, nullable=True)
    local_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    criador_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    cor: Mapped[str | None] = mapped_column(String, nullable=True)
    publico: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
