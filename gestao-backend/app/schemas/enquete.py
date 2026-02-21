from pydantic import BaseModel
from datetime import datetime


class EnqueteCreate(BaseModel):
    titulo: str
    descricao: str | None = None
    categoria: str = "decisao"
    opcoes: list[str]
    criador: str | None = None
    multipla_escolha: bool = False
    data_encerramento: datetime | None = None


class VotoCreate(BaseModel):
    opcao_index: int
    votante: str


class EnqueteUpdate(BaseModel):
    status: str | None = None


class EnqueteResponse(BaseModel):
    id: str
    titulo: str
    descricao: str | None = None
    categoria: str
    opcoes: list[str]
    votos: dict[str, int]
    votantes: dict[str, list[int]]
    criador: str | None = None
    status: str
    multipla_escolha: bool
    total_votos: int
    data_encerramento: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
