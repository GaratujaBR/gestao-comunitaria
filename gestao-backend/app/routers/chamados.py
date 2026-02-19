from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.chamado import Chamado
from app.models.prestador import Prestador
from app.schemas.chamado import ChamadoCreate, ChamadoUpdate, ChamadoResponse, MensagemPreview

router = APIRouter(prefix="/api/chamados", tags=["chamados"])

TEMPLATES = {
    "corretiva": (
        "Olá {nome}, aqui é da *Comunidade*.\n"
        "Identificamos um problema: *{estrutura}*\n"
        "Descrição: {descricao}\n"
        "Prioridade: {prioridade}\n"
        "Chamado #{numero:03d} - {data}\n"
        "Pode verificar o mais breve possível? Obrigado!"
    ),
    "preventiva": (
        "Olá {nome}, aqui é da *Comunidade*.\n"
        "Está na hora da manutenção preventiva: *{estrutura}*\n"
        "Detalhes: {descricao}\n"
        "Chamado #{numero:03d} - {data}\n"
        "Pode agendar uma visita? Obrigado!"
    ),
    "orcamento": (
        "Olá {nome}, aqui é da *Comunidade*.\n"
        "Precisamos de um orçamento para: *{estrutura}*\n"
        "Detalhes: {descricao}\n"
        "Chamado #{numero:03d} - {data}\n"
        "Pode nos enviar uma estimativa? Obrigado!"
    ),
    "urgente": (
        "🚨 *URGENTE* - Olá {nome}, aqui é da *Comunidade*.\n"
        "Problema crítico: *{estrutura}*\n"
        "Descrição: {descricao}\n"
        "Chamado #{numero:03d} - {data}\n"
        "Precisamos de atendimento IMEDIATO. Por favor, retorne o mais rápido possível!"
    ),
}


def _build_message(template_key: str, nome: str, estrutura: str, descricao: str, prioridade: str, numero: int, data: str) -> str:
    template = TEMPLATES.get(template_key, TEMPLATES["corretiva"])
    return template.format(
        nome=nome,
        estrutura=estrutura,
        descricao=descricao,
        prioridade=prioridade,
        numero=numero,
        data=data,
    )


def _whatsapp_url(telefone: str, mensagem: str) -> str:
    phone = telefone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace("+", "")
    if not phone.startswith("55"):
        phone = "55" + phone
    return f"https://wa.me/{phone}?text={quote(mensagem)}"


@router.get("/templates")
async def list_templates():
    return {
        "templates": [
            {"key": "corretiva", "label": "Manutenção Corretiva", "description": "Algo quebrou ou não está funcionando"},
            {"key": "preventiva", "label": "Manutenção Preventiva", "description": "Manutenção programada/periódica"},
            {"key": "orcamento", "label": "Orçamento", "description": "Solicitar orçamento para serviço"},
            {"key": "urgente", "label": "Urgente", "description": "Problema crítico que precisa de atenção imediata"},
        ]
    }


@router.get("", response_model=list[ChamadoResponse])
async def list_chamados(
    status: str | None = Query(None),
    prioridade: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Chamado).order_by(Chamado.created_at.desc())
    if status:
        query = query.where(Chamado.status == status)
    if prioridade:
        query = query.where(Chamado.prioridade == prioridade)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{chamado_id}", response_model=ChamadoResponse)
async def get_chamado(chamado_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).where(Chamado.id == chamado_id))
    chamado = result.scalar_one_or_none()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado not found")
    return chamado


@router.post("", response_model=ChamadoResponse, status_code=201)
async def create_chamado(data: ChamadoCreate, db: AsyncSession = Depends(get_db)):
    max_num = await db.execute(select(func.coalesce(func.max(Chamado.numero), 0)))
    next_numero = max_num.scalar() + 1

    prestador_nome = None
    prestador_telefone = None
    if data.prestador_id:
        result = await db.execute(select(Prestador).where(Prestador.id == data.prestador_id))
        prestador = result.scalar_one_or_none()
        if prestador:
            prestador_nome = prestador.nome
            prestador_telefone = prestador.telefone

    from datetime import datetime
    data_str = datetime.utcnow().strftime("%d/%m/%Y")

    mensagem = None
    if prestador_nome and prestador_telefone:
        mensagem = _build_message(
            template_key=data.tipo,
            nome=prestador_nome,
            estrutura=data.estrutura,
            descricao=data.descricao,
            prioridade=data.prioridade,
            numero=next_numero,
            data=data_str,
        )

    chamado = Chamado(
        numero=next_numero,
        estrutura=data.estrutura,
        area=data.area,
        descricao=data.descricao,
        prioridade=data.prioridade,
        tipo=data.tipo,
        prestador_id=data.prestador_id,
        prestador_nome=prestador_nome,
        prestador_telefone=prestador_telefone,
        solicitante=data.solicitante,
        mensagem_enviada=mensagem,
    )
    db.add(chamado)
    await db.commit()
    await db.refresh(chamado)
    return chamado


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


@router.get("/{chamado_id}/whatsapp", response_model=MensagemPreview)
async def get_whatsapp_link(chamado_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chamado).where(Chamado.id == chamado_id))
    chamado = result.scalar_one_or_none()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado not found")
    if not chamado.prestador_telefone:
        raise HTTPException(status_code=400, detail="Chamado sem prestador/telefone vinculado")

    mensagem = chamado.mensagem_enviada
    if not mensagem:
        from datetime import datetime
        mensagem = _build_message(
            template_key=chamado.tipo,
            nome=chamado.prestador_nome or "Responsável",
            estrutura=chamado.estrutura,
            descricao=chamado.descricao,
            prioridade=chamado.prioridade,
            numero=chamado.numero,
            data=chamado.created_at.strftime("%d/%m/%Y"),
        )

    return MensagemPreview(
        mensagem=mensagem,
        whatsapp_url=_whatsapp_url(chamado.prestador_telefone, mensagem),
    )
