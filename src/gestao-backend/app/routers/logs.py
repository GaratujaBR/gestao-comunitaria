from fastapi import APIRouter, Depends, Query
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
