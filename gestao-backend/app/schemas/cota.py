from pydantic import BaseModel
from datetime import datetime


class CotaCreate(BaseModel):
    slug: str
    numero: int
    nome: str
    ativo: bool = True


class CotaUpdate(BaseModel):
    nome: str | None = None
    ativo: bool | None = None
    em_obra: bool | None = None
    obra_info: dict | None = None


class CotaResponse(BaseModel):
    id: str
    slug: str
    numero: int
    nome: str
    ativo: bool
    em_obra: bool
    obra_info: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
