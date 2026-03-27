from pydantic import BaseModel
from datetime import datetime


class SheetRowCreate(BaseModel):
    area: str
    status: str
    responsavel: str | None = None
    item: str
    descricao: str | None = None
    quantidade: int | None = None
    valor: float | None = None
    total: float | None = None


class SheetRowResponse(BaseModel):
    id: str
    area: str
    status: str
    responsavel: str | None = None
    item: str
    descricao: str | None = None
    quantidade: int | None = None
    valor: float | None = None
    total: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SheetDataResponse(BaseModel):
    rows: list[SheetRowResponse]
    count: int
    total_compras: float
