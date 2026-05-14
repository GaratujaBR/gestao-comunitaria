import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SheetRow(Base):
    __tablename__ = "sheet_rows"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    data: Mapped[str | None] = mapped_column(String, nullable=True)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    valor: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo: Mapped[str | None] = mapped_column(String, nullable=True)
    comprovante: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
