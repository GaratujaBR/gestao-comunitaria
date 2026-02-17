import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WikiArticle(Base):
    __tablename__ = "wiki_articles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    conteudo: Mapped[str] = mapped_column(String, nullable=False)
    resumo_ia: Mapped[str | None] = mapped_column(String, nullable=True)
    entidades: Mapped[dict | None] = mapped_column(JSON, default=list)
    materiais: Mapped[dict | None] = mapped_column(JSON, default=list)
    dificuldade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tempo_execucao_horas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    autor_slug: Mapped[str | None] = mapped_column(String, nullable=True)
    validado: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
