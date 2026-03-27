from pydantic import BaseModel
from datetime import datetime


class ChamadoCreate(BaseModel):
    estrutura: str
    area: str | None = None
    descricao: str
    prioridade: str = "normal"
    tipo: str = "corretiva"
    prestador_id: str | None = None
    solicitante: str | None = None


class ChamadoUpdate(BaseModel):
    status: str | None = None
    resolucao: str | None = None
    prestador_id: str | None = None


class ChamadoResponse(BaseModel):
    id: str
    numero: int
    estrutura: str
    area: str | None = None
    descricao: str
    prioridade: str
    tipo: str
    status: str
    prestador_id: str | None = None
    prestador_nome: str | None = None
    prestador_telefone: str | None = None
    solicitante: str | None = None
    resolucao: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
