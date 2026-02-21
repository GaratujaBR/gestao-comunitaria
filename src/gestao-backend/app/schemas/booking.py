from pydantic import BaseModel
from datetime import datetime
from typing import Any


class BookingCreate(BaseModel):
    space_slug: str | None = None
    item_codigos: list[str] | None = None
    profile_slug: str
    data_inicio: datetime
    data_fim: datetime
    tipo_uso: str | None = None
    finalidade: str | None = None
    numero_pessoas: int | None = None
    status: str = "pendente"
    observacoes: str | None = None


class BookingUpdate(BaseModel):
    space_slug: str | None = None
    item_codigos: list[str] | None = None
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    tipo_uso: str | None = None
    finalidade: str | None = None
    numero_pessoas: int | None = None
    status: str | None = None
    checkin_itens: datetime | None = None
    checkout_itens: datetime | None = None
    checklist_entrada: dict[str, Any] | None = None
    checklist_saida: dict[str, Any] | None = None
    observacoes: str | None = None


class BookingResponse(BaseModel):
    id: str
    space_slug: str | None = None
    item_codigos: list[str] | None = None
    profile_slug: str
    data_inicio: datetime
    data_fim: datetime
    tipo_uso: str | None = None
    finalidade: str | None = None
    numero_pessoas: int | None = None
    status: str
    checkin_itens: datetime | None = None
    checkout_itens: datetime | None = None
    checklist_entrada: dict[str, Any] | None = None
    checklist_saida: dict[str, Any] | None = None
    observacoes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
