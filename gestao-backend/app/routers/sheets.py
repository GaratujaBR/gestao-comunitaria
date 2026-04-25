import csv
import io
import os
import time
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.item import Item
from app.schemas.sheet_row import SheetDataResponse, SheetRowResponse

router = APIRouter(prefix="/api/sheets", tags=["sheets"])

SHEET_CSV_URL = os.getenv(
    "GOOGLE_SHEET_CSV_URL",
    "https://docs.google.com/spreadsheets/d/1Wa5cB_C3ABzE74ozj7l1dLLL3B3wXWVZ/export?format=csv&gid=1161263825",
)

_cache: dict = {"data": None, "ts": 0.0}
CACHE_TTL = 300  # 5 minutos


def _parse_brl(value: str) -> float | None:
    if not value:
        return None
    cleaned = value.replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


async def _fetch_rows() -> list[SheetRowResponse]:
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < CACHE_TTL:
        return _cache["data"]

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(SHEET_CSV_URL)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Erro ao buscar planilha Google Sheets")

    reader = csv.reader(io.StringIO(resp.text))
    rows_out: list[SheetRowResponse] = []

    for i, row in enumerate(reader):
        if i == 0:
            continue  # skip header
        if not any(row):
            continue

        # Colunas: Área | Status | Responsável | Item | Descrição | Qtdd | Valor | Total
        def col(idx: int) -> str:
            return row[idx].strip() if idx < len(row) else ""

        qtd = col(5)
        rows_out.append(SheetRowResponse(
            id=str(uuid.uuid4()),
            area=col(0),
            status=col(1),
            responsavel=col(2) or None,
            item=col(3),
            descricao=col(4) or None,
            quantidade=int(qtd) if qtd.isdigit() else None,
            valor=_parse_brl(col(6)),
            total=_parse_brl(col(7)),
            created_at=None,  # type: ignore[arg-type]
        ))

    _cache["data"] = rows_out
    _cache["ts"] = now
    return rows_out


@router.get("", response_model=SheetDataResponse)
async def get_sheets():
    rows = await _fetch_rows()
    total_compras = sum(r.total or 0 for r in rows if r.status == "Compras")
    return SheetDataResponse(rows=rows, count=len(rows), total_compras=total_compras)


@router.post("/refresh")
async def refresh_cache():
    _cache["ts"] = 0.0
    rows = await _fetch_rows()
    return {"count": len(rows)}


@router.post("/sync")
async def sync_to_acervo(db: AsyncSession = Depends(get_db)):
    rows = await _fetch_rows()
    existing = await db.execute(select(Item))
    existing_codes = {i.codigo for i in existing.scalars().all()}

    created = 0
    updated = 0
    for row in rows:
        code = f"{row.area.lower()}.{row.item.lower().replace(' ', '_')}"
        if code not in existing_codes:
            item = Item(
                codigo=code,
                nome=row.item,
                descricao=row.descricao,
                categoria=row.area.lower(),
                estado="bom",
            )
            db.add(item)
            created += 1
            existing_codes.add(code)
        else:
            updated += 1

    await db.commit()
    return {"created": created, "updated": updated}
