from pydantic import BaseModel
from datetime import datetime, date


class ItemCreate(BaseModel):
    codigo: str
    nome: str
    descricao: str | None = None
    space_slug: str | None = None
    container_especifico: str | None = None
    categoria: str | None = None
    estado: str = "bom"
    manual_cuidados: str | None = None
    ciclo_manutencao: str | None = None
    ultima_manutencao: date | None = None
    proxima_manutencao: date | None = None
    tags: list[str] | None = None
    fotos: list[str] | None = None
    qr_code_url: str | None = None


class ItemUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    space_slug: str | None = None
    container_especifico: str | None = None
    categoria: str | None = None
    estado: str | None = None
    manual_cuidados: str | None = None
    ciclo_manutencao: str | None = None
    ultima_manutencao: date | None = None
    proxima_manutencao: date | None = None
    vezes_usado: int | None = None
    tags: list[str] | None = None
    fotos: list[str] | None = None
    qr_code_url: str | None = None


class ItemResponse(BaseModel):
    id: str
    codigo: str
    nome: str
    descricao: str | None = None
    space_slug: str | None = None
    container_especifico: str | None = None
    categoria: str | None = None
    estado: str
    manual_cuidados: str | None = None
    ciclo_manutencao: str | None = None
    ultima_manutencao: date | None = None
    proxima_manutencao: date | None = None
    vezes_usado: int
    tags: list[str] | None = None
    fotos: list[str] | None = None
    qr_code_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
