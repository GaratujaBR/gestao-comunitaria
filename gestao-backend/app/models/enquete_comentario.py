import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class EnqueteComentario(Base):
    __tablename__ = "enquete_comentarios"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    enquete_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("enquetes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    autor: Mapped[str] = mapped_column(String, nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
