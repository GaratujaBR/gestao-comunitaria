import csv
import io
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.database import get_db
from app.models.item import Item
from pydantic import BaseModel

router = APIRouter(prefix="/api/sheets", tags=["sheets"])

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "16fCr0rhUfZKw8THvfoVxlMcn95XKxs2N/export?format=csv"
)


class SheetRow(BaseModel):
    area: str
    status: str
    responsavel: str | None = None
    item: str
    descricao: str | None = None
    quantidade: int | None = None
    valor: float | None = None
    total: float | None = None


class SheetData(BaseModel):
    rows: list[SheetRow]
    total_compras: float
    total_arrecadacao: float
    count: int


class SyncResult(BaseModel):
    created: int
    updated: int
    skipped: int


def _parse_int(val: str) -> int | None:
    val = val.strip()
    if not val:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _parse_float(val: str) -> float | None:
    val = val.strip().replace(",", ".")
    if not val:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("ã", "a").replace("á", "a").replace("â", "a")
    text = text.replace("é", "e").replace("ê", "e")
    text = text.replace("í", "i").replace("ó", "o").replace("ô", "o")
    text = text.replace("ú", "u").replace("ç", "c")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = text.strip("_")
    return text


async def _fetch_sheet() -> list[SheetRow]:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        resp = await client.get(SHEET_CSV_URL)
        resp.raise_for_status()

    reader = csv.reader(io.StringIO(resp.text))
    header = next(reader, None)
    if not header:
        return []

    rows: list[SheetRow] = []
    for line in reader:
        if len(line) < 4:
            continue
        area = line[0].strip()
        item_name = line[3].strip()
        if not area or not item_name:
            continue
        if area.startswith(",") or item_name.lower().startswith("total"):
            continue

        rows.append(SheetRow(
            area=area,
            status=line[1].strip() if len(line) > 1 else "",
            responsavel=line[2].strip() or None if len(line) > 2 else None,
            item=item_name,
            descricao=line[4].strip() or None if len(line) > 4 else None,
            quantidade=_parse_int(line[5]) if len(line) > 5 else None,
            valor=_parse_float(line[6]) if len(line) > 6 else None,
            total=_parse_float(line[7]) if len(line) > 7 else None,
        ))

    return rows


@router.get("", response_model=SheetData)
async def get_sheet_data():
    try:
        rows = await _fetch_sheet()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet: {e}")

    total_compras = sum(r.total or 0 for r in rows if r.status == "Compras")
    total_arrecadacao = 0
    for r in rows:
        if r.total and r.status in ("Doação", "Caixinha"):
            total_arrecadacao += r.total

    return SheetData(
        rows=rows,
        total_compras=total_compras,
        total_arrecadacao=total_arrecadacao,
        count=len(rows),
    )


@router.post("/sync", response_model=SyncResult)
async def sync_sheet_to_items(db: AsyncSession = Depends(get_db)):
    try:
        rows = await _fetch_sheet()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet: {e}")

    created = 0
    updated = 0
    skipped = 0
    seen_codigos: dict[str, int] = {}

    status_to_estado = {
        "Compras": "bom",
        "Doação": "bom",
        "Investir": "novo",
        "Caixinha": "bom",
    }

    area_to_categoria = {
        "Cozinha": "cozinha",
        "Banheiro": "banheiro",
        "Limpeza": "limpeza",
        "Lazer": "lazer",
        "SOS": "sos",
        "Banheiro ": "banheiro",
    }

    for row in rows:
        area_slug = _slugify(row.area)
        item_slug = _slugify(row.item)
        base_codigo = f"{area_slug}.{item_slug}"

        if base_codigo in seen_codigos:
            seen_codigos[base_codigo] += 1
            codigo = f"{base_codigo}_{seen_codigos[base_codigo]:02d}"
        else:
            seen_codigos[base_codigo] = 1
            codigo = base_codigo

        result = await db.execute(select(Item).where(Item.codigo == codigo))
        existing = result.scalar_one_or_none()

        estado = status_to_estado.get(row.status, "bom")
        categoria = area_to_categoria.get(row.area, area_slug)

        desc_parts = []
        if row.descricao:
            desc_parts.append(row.descricao)
        if row.responsavel:
            desc_parts.append(f"Responsável: {row.responsavel}")
        if row.status:
            desc_parts.append(f"Status planilha: {row.status}")
        if row.valor:
            desc_parts.append(f"Valor: R${row.valor:.2f}")
        descricao = " | ".join(desc_parts) if desc_parts else None

        tags = []
        if row.status:
            tags.append(row.status.lower())
        if row.responsavel:
            tags.append(row.responsavel.lower())

        if existing:
            existing.nome = row.item
            existing.descricao = descricao
            existing.categoria = categoria
            existing.estado = estado
            existing.tags = tags
            updated += 1
        else:
            item = Item(
                codigo=codigo,
                nome=row.item,
                descricao=descricao,
                categoria=categoria,
                estado=estado,
                tags=tags,
            )
            db.add(item)
            created += 1

    await db.commit()
    return SyncResult(created=created, updated=updated, skipped=skipped)
