from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.chamado import Chamado
from app.models.prestador import Prestador
from app.schemas.chamado import ChamadoCreate, ChamadoUpdate, ChamadoResponse
from urllib.parse import quote

router = APIRouter(prefix="/api/chamados", tags=["chamados"])


@router.get("", response_model=list[ChamadoResponse])
async def list_chamados(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).order_by(Chamado.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=ChamadoResponse, status_code=201)
async def create_chamado(data: ChamadoCreate, db: AsyncSession = Depends(get_db)):
    max_num = await db.execute(select(func.coalesce(func.max(Chamado.numero), 0)))
    next_num = max_num.scalar() + 1

    chamado_data = data.model_dump()
    prestador_nome = None
    prestador_telefone = None

    if data.prestador_id:
        result = await db.execute(select(Prestador).where(Prestador.id == data.prestador_id))
        prestador = result.scalar_one_or_none()
        if prestador:
            prestador_nome = prestador.nome
            prestador_telefone = prestador.telefone

    chamado = Chamado(
        **chamado_data,
        numero=next_num,
        prestador_nome=prestador_nome,
        prestador_telefone=prestador_telefone,
    )
    db.add(chamado)
    await db.commit()
    await db.refresh(chamado)
    return chamado


@router.get("/{chamado_id}/whatsapp")
async def get_whatsapp_link(chamado_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).where(Chamado.id == chamado_id))
    chamado = result.scalar_one_or_none()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado not found")
    if not chamado.prestador_telefone:
        raise HTTPException(status_code=400, detail="No phone number")

    phone = chamado.prestador_telefone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
    if not phone.startswith("55"):
        phone = "55" + phone
    msg = quote(f"Olá! Temos um chamado de manutenção:\n\n*{chamado.estrutura}*\n{chamado.descricao}")
    return {"url": f"https://wa.me/{phone}?text={msg}"}


@router.put("/{chamado_id}", response_model=ChamadoResponse)
async def update_chamado(chamado_id: str, data: ChamadoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).where(Chamado.id == chamado_id))
    chamado = result.scalar_one_or_none()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(chamado, key, value)
    await db.commit()
    await db.refresh(chamado)
    return chamado


@router.delete("/{chamado_id}", status_code=204)
async def delete_chamado(chamado_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).where(Chamado.id == chamado_id))
    chamado = result.scalar_one_or_none()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado not found")
    await db.delete(chamado)
    await db.commit()
