from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[ItemResponse])
async def list_items(
    categoria: str | None = Query(None),
    estado: str | None = Query(None),
    space_slug: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Item).order_by(Item.nome)
    if categoria:
        query = query.where(Item.categoria == categoria)
    if estado:
        query = query.where(Item.estado == estado)
    if space_slug:
        query = query.where(Item.space_slug == space_slug)
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
