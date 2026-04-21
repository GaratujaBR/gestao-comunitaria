from pydantic import BaseModel
from datetime import datetime
from typing import Any


class EnqueteCreate(BaseModel):
    titulo: str
    descricao: str | None = None
    categoria: str = "decisao"
    opcoes: list[str]
    criador: str | None = None
    multipla_escolha: bool = False


class EnqueteUpdate(BaseModel):
    status: str | None = None


class VotoCreate(BaseModel):
    opcao_index: int
    cota_slug: str


class EnqueteResponse(BaseModel):
    id: str
    titulo: str
    descricao: str | None = None
    categoria: str
    opcoes: list[str]
    votos: dict[str, Any]
    votantes: dict[str, Any]
    total_votos: int
    criador: str | None = None
    multipla_escolha: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
