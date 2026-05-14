import csv
import io
import os
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/api/items", tags=["items"])

ACERVO_CSV_URL = os.getenv("GOOGLE_ACERVO_CSV_URL", "")

_CATEGORIA_MAP = {
    "cozinha": "cozinha", "banheiro": "banheiro", "lazer": "lazer",
    "infraestrutura": "infraestrutura", "ferramentas": "ferramentas",
    "eletronicos": "eletronicos", "eletrônicos": "eletronicos",
    "saude": "saude", "saúde": "saude", "mobilia": "mobilia",
    "mobília": "mobilia", "limpeza": "limpeza", "construcao": "construcao",
    "outros": "outros", "jardim": "jardim",
}
_ESTADO_MAP = {
    "bom": "bom", "novo": "novo", "regular": "regular",
    "manutencao": "manutencao", "indisponivel": "indisponivel", "em_uso": "bom",
}


def _slugify(text: str) -> str:
    text = text.lower().strip()
    for k, v in {"á":"a","à":"a","ã":"a","â":"a","é":"e","ê":"e","í":"i",
                 "ó":"o","ô":"o","õ":"o","ú":"u","ü":"u","ç":"c"}.items():
        text = text.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")


def _parse_valor(val: str) -> float | None:
    if not val:
        return None
    cleaned = re.sub(r"[^\d,.]", "", val).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


@router.get("", response_model=list[ItemResponse])
async def list_items(
    categoria: str | None = Query(None),
    estado: str | None = Query(None),
    space_slug: str | None = Query(None),
    tipo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Item).order_by(Item.nome)
    if categoria:
        query = query.where(Item.categoria == categoria)
    if estado:
        query = query.where(Item.estado == estado)
    if space_slug:
        query = query.where(Item.space_slug == space_slug)
    if tipo:
        query = query.where(Item.tipo == tipo)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{codigo}", response_model=ItemResponse)
async def get_item(codigo: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.codigo == codigo))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=ItemResponse, status_code=201)
async def create_item(data: ItemCreate, db: AsyncSession = Depends(get_db)):
    item = Item(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{codigo}", response_model=ItemResponse)
async def update_item(codigo: str, data: ItemUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.codigo == codigo))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{codigo}", status_code=204)
async def delete_item(codigo: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).where(Item.codigo == codigo))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()


@router.post("/sync-sheet")
async def sync_sheet(db: AsyncSession = Depends(get_db)):
    if not ACERVO_CSV_URL:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_ACERVO_CSV_URL não configurada no ambiente",
        )

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(ACERVO_CSV_URL)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Erro ao buscar planilha de acervo")

    reader = csv.reader(io.StringIO(resp.text))
    rows = list(reader)

    created = updated = skipped = 0
    used_codigos: set[str] = set()

    for i, row in enumerate(rows):
        if i == 0 or not any(c.strip() for c in row):
            continue

        def col(idx: int) -> str:
            return row[idx].strip() if idx < len(row) else ""

        nome = col(1)
        if not nome:
            continue

        categoria_slug = _slugify(col(2))
        categoria = _CATEGORIA_MAP.get(categoria_slug, categoria_slug) if col(2) else None
        descricao = col(3) or None
        qtdd_raw = col(4)
        local = col(5)
        estado_slug = _slugify(col(6))
        estado = _ESTADO_MAP.get(estado_slug, "bom")
        responsavel = col(7) or None
        valor_estimado = _parse_valor(col(8))
        disponibilidade = col(9) or None
        origem = col(10) or None
        space_slug = _slugify(local) if local else None
        quantidade = int(qtdd_raw) if qtdd_raw.isdigit() else None

        base_codigo = f"{categoria or 'outros'}.{_slugify(nome)}"
        codigo = base_codigo
        idx = 1
        while codigo in used_codigos:
            codigo = f"{base_codigo}_{idx:02d}"
            idx += 1
        used_codigos.add(codigo)

        result = await db.execute(select(Item).where(Item.codigo == codigo))
        existing = result.scalar_one_or_none()

        if existing:
            existing.nome = nome
            existing.descricao = descricao
            existing.categoria = categoria
            existing.space_slug = space_slug
            existing.estado = estado
            existing.responsavel = responsavel
            existing.valor_estimado = valor_estimado
            existing.disponibilidade = disponibilidade
            existing.origem = origem
            existing.quantidade = quantidade
            updated += 1
        else:
            db.add(Item(
                codigo=codigo, nome=nome, descricao=descricao,
                categoria=categoria, space_slug=space_slug, estado=estado,
                tipo="comum", responsavel=responsavel,
                valor_estimado=valor_estimado, disponibilidade=disponibilidade,
                origem=origem, quantidade=quantidade,
            ))
            created += 1

    await db.commit()
    return {"created": created, "updated": updated, "skipped": skipped}
