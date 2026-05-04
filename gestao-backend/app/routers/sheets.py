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
    "",
)
SHEET_FLUXO_CSV_URL = os.getenv("GOOGLE_SHEET_FLUXO_CSV_URL", "")

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
        if not any(row):
            continue

        # Colunas: Área | Status | Responsável | Item | Descrição | Qtdd | Valor | Total
        def col(idx: int) -> str:
            return row[idx].strip() if idx < len(row) else ""

        qtd = col(5)
        rows_out.append(
            SheetRowResponse(
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
            )
        )

    _cache["data"] = rows_out
    _cache["ts"] = now
    return rows_out


async def _fetch_saldo() -> float | None:
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(SHEET_FLUXO_CSV_URL)
        if resp.status_code != 200:
            print(f"[saldo] HTTP {resp.status_code} url={SHEET_FLUXO_CSV_URL} body={resp.text[:300]}")
            return None

    reader = csv.reader(io.StringIO(resp.text))
    saldo_idx = -1
    last_saldo: float | None = None

    for row in reader:
        if not any(cell.strip() for cell in row):
            continue

        if saldo_idx < 0:
            # ainda procurando o header
            for idx, col in enumerate(row):
                if "saldo" in col.strip().lower():
                    saldo_idx = idx
                    break
            continue

        if saldo_idx >= len(row):
            continue

        cell = row[saldo_idx].strip()
        if cell:
            val = _parse_brl(cell)
            if val is not None:
                last_saldo = val

    return last_saldo


@router.get("", response_model=SheetDataResponse)
async def get_sheets():
    if not SHEET_CSV_URL:
        raise HTTPException(
            status_code=503,
            detail="Planilha não configurada. Defina GOOGLE_SHEET_CSV_URL no .env",
        )
    rows = await _fetch_rows()
    total_compras = sum(r.total or 0 for r in rows if r.status == "Compras")

    if not SHEET_FLUXO_CSV_URL:
        print("[saldo] GOOGLE_SHEET_FLUXO_CSV_URL nao configurada")
        saldo = None
    else:
        try:
            saldo = await _fetch_saldo()
        except Exception as e:
            print(f"[saldo] excecao: {e}")
            saldo = None

    return SheetDataResponse(
        rows=rows,
        count=len(rows),
        total_compras=total_compras,
        saldo_atual=saldo,
    )


@router.get("/debug-saldo")
async def debug_saldo():
    url = SHEET_FLUXO_CSV_URL
    masked_url = (url[:40] + "...") if len(url) > 40 else url
    if not url:
        return {"configured": False, "url": None, "error": "GOOGLE_SHEET_FLUXO_CSV_URL nao configurada"}

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        try:
            resp = await client.get(url)
        except Exception as e:
            return {"configured": True, "url": masked_url, "error": str(e)}

    if resp.status_code != 200:
        return {"configured": True, "url": masked_url, "http_status": resp.status_code, "body_preview": resp.text[:300]}

    reader = csv.reader(io.StringIO(resp.text))
    saldo_idx = -1
    rows_preview = []
    last_saldo = None
    all_rows = list(reader)

    for i, row in enumerate(all_rows):
        if not any(cell.strip() for cell in row):
            continue
        if saldo_idx < 0:
            for idx, col in enumerate(row):
                if "saldo" in col.strip().lower():
                    saldo_idx = idx
                    break
            rows_preview.append({"row_index": i, "type": "header", "cells": row[:6]})
            continue
        if i < 5:
            rows_preview.append({"row_index": i, "type": "data", "cells": row[:6]})
        if saldo_idx < len(row) and row[saldo_idx].strip():
            val = _parse_brl(row[saldo_idx].strip())
            if val is not None:
                last_saldo = val

    return {
        "configured": True,
        "url": masked_url,
        "http_status": resp.status_code,
        "saldo_col_index": saldo_idx,
        "saldo_col_found": saldo_idx >= 0,
        "last_saldo": last_saldo,
        "rows_preview": rows_preview,
        "total_rows": len(all_rows),
    }


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
