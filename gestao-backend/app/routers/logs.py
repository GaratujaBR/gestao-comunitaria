from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.log import Log
from app.schemas.log import LogCreate, LogResponse

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=list[LogResponse])
async def list_logs(
    item_codigo: str | None = Query(None),
    profile_slug: str | None = Query(None),
    acao: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Log).order_by(Log.timestamp.desc())
    if item_codigo:
        query = query.where(Log.item_codigo == item_codigo)
    if profile_slug:
        query = query.where(Log.profile_slug == profile_slug)
    if acao:
        query = query.where(Log.acao == acao)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=LogResponse, status_code=201)
async def create_log(data: LogCreate, db: AsyncSession = Depends(get_db)):
    log = Log(**data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.post("/sync-sheet")
async def sync_logs_from_sheet(db: AsyncSession = Depends(get_db)):
    # Import here to avoid circular dependency
    from app.routers.sheets import _fetch_rows

    try:
        rows = await _fetch_rows()
    except HTTPException:
        return {"created": 0, "skipped": 0, "error": "planilha_nao_configurada"}

    # Map sheet status to log actions
    status_to_acao = {
        "Compras": "compra_realizada",
        "Doação": "doacao_recebida",
        "Investir": "investimento_planejado",
        "Caixinha": "reposicao_caixinha",
    }

    # Get existing item_codigos to avoid duplicates
    result = await db.execute(
        select(Log.item_codigo).where(Log.item_codigo.isnot(None))
    )
    existing_codes = {r for r in result.scalars().all() if r}

    created = 0
    skipped = 0

    for row in rows:
        acao = status_to_acao.get(row.status)
        if not acao:
            continue

        # Generate item_codigo
        area = (row.area or "").lower().strip()
        item = (row.item or "").lower().strip().replace(" ", "_")
        item_codigo = f"{area}.{item}" if area and item else None

        if item_codigo and item_codigo in existing_codes:
            skipped += 1
            continue

        # Build description with quantity and value
        parts = []
        if row.quantidade is not None:
            parts.append(f"{row.quantidade}x")
        if row.descricao:
            parts.append(row.descricao)
        if row.valor is not None:
            parts.append(f"R${row.valor:.2f}")

        descricao = " — ".join(parts) if parts else None

        log = Log(
            item_codigo=item_codigo,
            acao=acao,
            profile_slug=row.responsavel,
            local_uso=row.area or None,
            descricao_incidente=descricao,
        )
        db.add(log)
        created += 1
        if item_codigo:
            existing_codes.add(item_codigo)

    await db.commit()
    return {"created": created, "skipped": skipped}
