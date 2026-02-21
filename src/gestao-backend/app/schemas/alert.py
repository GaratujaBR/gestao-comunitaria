from pydantic import BaseModel
from datetime import datetime
from typing import Any


class AlertCreate(BaseModel):
    tipo: str | None = None
    profile_slug: str | None = None
    titulo: str
    mensagem: str | None = None
    dados_json: dict[str, Any] | None = None
    data_acao: datetime | None = None


class AlertUpdate(BaseModel):
    lido: bool | None = None
    titulo: str | None = None
    mensagem: str | None = None


class AlertResponse(BaseModel):
    id: str
    tipo: str | None = None
    profile_slug: str | None = None
    titulo: str
    mensagem: str | None = None
    dados_json: dict[str, Any] | None = None
    lido: bool
    data_acao: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
