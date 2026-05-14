import csv
import io
import os
import time
import uuid
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException
from app.schemas.sheet_row import SheetDataResponse, SheetRowResponse

router = APIRouter(prefix="/api/sheets", tags=["sheets"])

SHEET_CSV_URL = os.getenv("GOOGLE_SHEET_CSV_URL", "")

_cache: dict = {"data": None, "ts": 0.0}
CACHE_TTL = 300  # 5 minutos


def _parse_brl(value: str) -> float | None:
    if not value:
        return None
    cleaned = (
        value.replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    )
    try:
        return float(cleaned)
    except ValueError:
        return None


def _current_month() -> tuple[int, int]:
    now = datetime.now(timezone.utc)
    return now.year, now.month


def _is_current_month(date_str: str | None) -> bool:
    if not date_str:
        return False
    try:
        d = datetime.strptime(date_str.strip(), "%Y-%m-%d")
        year, month = _current_month()
        return d.year == year and d.month == month
    except ValueError:
        return False


async def _fetch_rows() -> list[SheetRowResponse]:
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < CACHE_TTL:
        return _cache["data"]

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(SHEET_CSV_URL)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502, detail="Erro ao buscar planilha Google Sheets"
            )

    reader = csv.reader(io.StringIO(resp.text))
    rows_out: list[SheetRowResponse] = []

    for i, row in enumerate(reader):
        if i == 0:
            continue  # skip header
        if not any(cell.strip() for cell in row):
            continue

        # Colunas: Data | Descrição | Categoria | Valor (R$) | Tipo | Comprovante
        def col(idx: int) -> str:
            return row[idx].strip() if idx < len(row) else ""

        rows_out.append(
            SheetRowResponse(
                id=str(uuid.uuid4()),
                data=col(0) or None,
                descricao=col(1) or None,
                categoria=col(2) or None,
                valor=_parse_brl(col(3)),
                tipo=col(4) or None,
                comprovante=col(5) or None,
            )
        )

    _cache["data"] = rows_out
    _cache["ts"] = now
    return rows_out


@router.get("", response_model=SheetDataResponse)
async def get_sheets():
    if not SHEET_CSV_URL:
        raise HTTPException(
            status_code=503,
            detail="Planilha não configurada. Defina GOOGLE_SHEET_CSV_URL no .env",
        )
    rows = await _fetch_rows()

    total_entradas = sum(r.valor or 0 for r in rows if r.tipo == "Entrada")
    total_saidas = sum(r.valor or 0 for r in rows if r.tipo == "Saída")
    saldo_atual = total_entradas - total_saidas

    total_entradas_mes = sum(
        r.valor or 0 for r in rows if r.tipo == "Entrada" and _is_current_month(r.data)
    )
    total_saidas_mes = sum(
        r.valor or 0 for r in rows if r.tipo == "Saída" and _is_current_month(r.data)
    )

    return SheetDataResponse(
        rows=rows,
        count=len(rows),
        saldo_atual=saldo_atual,
        total_entradas=total_entradas,
        total_saidas=total_saidas,
        total_entradas_mes=total_entradas_mes,
        total_saidas_mes=total_saidas_mes,
    )


@router.post("/refresh")
async def refresh_cache():
    _cache["ts"] = 0.0
    rows = await _fetch_rows()
    return {"count": len(rows)}
