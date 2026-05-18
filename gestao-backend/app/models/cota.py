import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Cota(Base):
    __tablename__ = "cotas"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    numero: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    em_obra: Mapped[bool] = mapped_column(Boolean, default=False)
    obra_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
