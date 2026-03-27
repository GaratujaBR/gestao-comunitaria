from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.sheet_row import SheetRow
from app.models.item import Item
from app.schemas.sheet_row import SheetRowCreate, SheetDataResponse, SheetRowResponse

router = APIRouter(prefix="/api/sheets", tags=["sheets"])


@router.get("", response_model=SheetDataResponse)
async def get_sheets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SheetRow).order_by(SheetRow.area, SheetRow.item))
    rows = result.scalars().all()
    total_compras = sum(r.total or 0 for r in rows if r.status == "Compras")
    return SheetDataResponse(
        rows=[SheetRowResponse.model_validate(r) for r in rows],
        count=len(rows),
        total_compras=total_compras,
    )


@router.post("", response_model=SheetRowResponse, status_code=201)
async def create_sheet_row(data: SheetRowCreate, db: AsyncSession = Depends(get_db)):
    row = SheetRow(**data.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/sync")
async def sync_to_acervo(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SheetRow))
    rows = result.scalars().all()

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
