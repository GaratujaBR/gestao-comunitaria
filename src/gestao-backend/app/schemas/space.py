from pydantic import BaseModel
from datetime import datetime
from typing import Any


class SpaceCreate(BaseModel):
    slug: str
    nome: str
    tipo: str | None = None
    capacidade: int | None = None
    area_m2: float | None = None
    caracteristicas: dict[str, Any] | None = None
    regras_uso: str | None = None
    instrucoes_acesso: str | None = None
    fotos: list[str] | None = None
    responsavel_slug: str | None = None
    status: str = "ativo"


class SpaceUpdate(BaseModel):
    nome: str | None = None
    tipo: str | None = None
    capacidade: int | None = None
    area_m2: float | None = None
    caracteristicas: dict[str, Any] | None = None
    regras_uso: str | None = None
    instrucoes_acesso: str | None = None
    fotos: list[str] | None = None
    responsavel_slug: str | None = None
    status: str | None = None


class SpaceResponse(BaseModel):
    id: str
    slug: str
    nome: str
    tipo: str | None = None
    capacidade: int | None = None
    area_m2: float | None = None
    caracteristicas: dict[str, Any] | None = None
    regras_uso: str | None = None
    instrucoes_acesso: str | None = None
    fotos: list[str] | None = None
    responsavel_slug: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
