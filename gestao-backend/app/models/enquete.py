import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Enquete(Base):
    __tablename__ = "enquetes"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str] = mapped_column(String, default="decisao")
    tipo: Mapped[str] = mapped_column(String, default="multipla")
    opcoes: Mapped[list] = mapped_column(JSON, nullable=False)
    votos: Mapped[dict] = mapped_column(JSON, default=dict)
    votantes: Mapped[dict] = mapped_column(JSON, default=dict)
    total_votos: Mapped[int] = mapped_column(Integer, default=0)
    criador: Mapped[str | None] = mapped_column(String, nullable=True)
    multipla_escolha: Mapped[bool] = mapped_column(Boolean, default=False)
    anonima: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="rascunho")
    quorum_required: Mapped[int] = mapped_column(Integer, default=60)
    approval_threshold: Mapped[int] = mapped_column(Integer, default=66)
    closes_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    voting_starts_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    result_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    respostas: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
