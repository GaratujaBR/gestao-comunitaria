from pydantic import BaseModel
from datetime import datetime


class LogCreate(BaseModel):
    item_codigo: str | None = None
    acao: str
    profile_slug: str | None = None
    booking_id: str | None = None
    local_uso: str | None = None
    condicao_saida: str | None = None
    condicao_retorno: str | None = None
    descricao_incidente: str | None = None
    fotos_evidencia: list[str] | None = None
    clima: str | None = None
    sazonalidade: str | None = None


class LogResponse(BaseModel):
    id: str
    item_codigo: str | None = None
    acao: str
    profile_slug: str | None = None
    booking_id: str | None = None
    timestamp: datetime
    local_uso: str | None = None
    condicao_saida: str | None = None
    condicao_retorno: str | None = None
    descricao_incidente: str | None = None
    fotos_evidencia: list[str] | None = None
    clima: str | None = None
    sazonalidade: str | None = None

    model_config = {"from_attributes": True}
