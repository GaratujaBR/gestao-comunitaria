from pydantic import BaseModel
from datetime import datetime
from typing import Any


class WikiArticleCreate(BaseModel):
    slug: str
    titulo: str
    categoria: str | None = None
    conteudo: str
    resumo_ia: str | None = None
    entidades: list[str] | None = None
    materiais: list[dict[str, Any]] | None = None
    dificuldade: int | None = None
    tempo_execucao_horas: int | None = None
    autor_slug: str | None = None
    validado: bool = False


class WikiArticleUpdate(BaseModel):
    titulo: str | None = None
    categoria: str | None = None
    conteudo: str | None = None
    resumo_ia: str | None = None
    entidades: list[str] | None = None
    materiais: list[dict[str, Any]] | None = None
    dificuldade: int | None = None
    tempo_execucao_horas: int | None = None
    autor_slug: str | None = None
    validado: bool | None = None


class WikiArticleResponse(BaseModel):
    id: str
    slug: str
    titulo: str
    categoria: str | None = None
    conteudo: str
    resumo_ia: str | None = None
    entidades: list[str] | None = None
    materiais: list[dict[str, Any]] | None = None
    dificuldade: int | None = None
    tempo_execucao_horas: int | None = None
    autor_slug: str | None = None
    validado: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
