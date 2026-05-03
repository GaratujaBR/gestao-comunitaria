from pydantic import BaseModel
from datetime import datetime


class EventoCreate(BaseModel):
    titulo: str
    descricao: str | None = None
    data_inicio: datetime
    data_fim: datetime
    tipo: str | None = None
    local_slug: str | None = None
    criador_slug: str | None = None
    cor: str | None = None
    publico: bool = True


class EventoUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    tipo: str | None = None
    local_slug: str | None = None
    criador_slug: str | None = None
    cor: str | None = None


class EventoResponse(BaseModel):
    id: str
    titulo: str
    descricao: str | None = None
    data_inicio: datetime
    data_fim: datetime
    tipo: str | None = None
    local_slug: str | None = None
    criador_slug: str | None = None
    cor: str | None = None
    publico: bool
    created_at: datetime

    model_config = {"from_attributes": True}
