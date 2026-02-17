from pydantic import BaseModel
from datetime import datetime


class ProfileCreate(BaseModel):
    slug: str
    nome_completo: str
    nome_curto: str | None = None
    email: str | None = None
    telefone: str | None = None
    role: str | None = None
    lote: str | None = None
    ativo: bool = True


class ProfileUpdate(BaseModel):
    nome_completo: str | None = None
    nome_curto: str | None = None
    email: str | None = None
    telefone: str | None = None
    role: str | None = None
    lote: str | None = None
    ativo: bool | None = None


class ProfileResponse(BaseModel):
    id: str
    slug: str
    nome_completo: str
    nome_curto: str | None = None
    email: str | None = None
    telefone: str | None = None
    role: str | None = None
    lote: str | None = None
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}
