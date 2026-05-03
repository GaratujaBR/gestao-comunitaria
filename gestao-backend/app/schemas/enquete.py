from pydantic import BaseModel
from datetime import datetime
from typing import Any


class EnqueteCreate(BaseModel):
    titulo: str
    descricao: str | None = None
    categoria: str = "decisao"
    tipo: str = "multipla"
    opcoes: list[str]
    criador: str | None = None
    multipla_escolha: bool = False
    quorum_required: int = 60
    approval_threshold: int = 66
    closes_at: datetime | None = None
    voting_starts_at: datetime | None = None
    result_action: str | None = None


class EnqueteUpdate(BaseModel):
    status: str | None = None
    titulo: str | None = None
    descricao: str | None = None
    result_action: str | None = None
    closes_at: datetime | None = None
    voting_starts_at: datetime | None = None
    quorum_required: int | None = None
    approval_threshold: int | None = None


class VotoCreate(BaseModel):
    opcao_index: int
    cota_slug: str
    melhoria: str | None = None


class EnqueteResponse(BaseModel):
    id: str
    titulo: str
    descricao: str | None = None
    categoria: str
    tipo: str = "multipla"
    opcoes: list[str]
    votos: dict[str, Any]
    votantes: dict[str, Any]
    total_votos: int
    criador: str | None = None
    multipla_escolha: bool
    status: str
    quorum_required: int = 60
    approval_threshold: int = 66
    closes_at: datetime | None = None
    voting_starts_at: datetime | None = None
    result_action: str | None = None
    respostas: dict[str, str] = {}
    created_at: datetime
    # computed fields (not stored in DB)
    quorum_percent: int | None = None
    quorum_met: bool | None = None
    approval_percent: int | None = None
    approved: bool | None = None

    model_config = {"from_attributes": True}


class ComentarioCreate(BaseModel):
    autor: str
    conteudo: str


class ComentarioResponse(BaseModel):
    id: str
    enquete_id: str
    autor: str
    conteudo: str
    created_at: datetime

    model_config = {"from_attributes": True}
