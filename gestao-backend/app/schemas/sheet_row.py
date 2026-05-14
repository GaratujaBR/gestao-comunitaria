from pydantic import BaseModel
from typing import Optional


class SheetRowResponse(BaseModel):
    id: str
    data: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    valor: Optional[float] = None
    tipo: Optional[str] = None
    comprovante: Optional[str] = None

    model_config = {"from_attributes": True}


class SheetDataResponse(BaseModel):
    rows: list[SheetRowResponse]
    count: int
    saldo_atual: float
    total_entradas: float
    total_saidas: float
    total_entradas_mes: float
    total_saidas_mes: float
