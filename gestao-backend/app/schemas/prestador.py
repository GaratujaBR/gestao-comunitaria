from pydantic import BaseModel
from datetime import datetime


class PrestadorCreate(BaseModel):
    nome: str
    telefone: str
    especialidade: str | None = None
    empresa: str | None = None
    notas: str | None = None
    ativo: bool = True


class PrestadorUpdate(BaseModel):
    nome: str | None = None
    telefone: str | None = None
    especialidade: str | None = None
    empresa: str | None = None
    notas: str | None = None
    ativo: bool | None = None


class PrestadorResponse(BaseModel):
    id: str
    nome: str
    telefone: str
    especialidade: str | None = None
    empresa: str | None = None
    notas: str | None = None
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
