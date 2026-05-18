from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.enquete import Enquete
from app.models.enquete_comentario import EnqueteComentario
from app.models.cota import Cota
from app.models.log import Log
from app.models.alert import Alert
from app.schemas.enquete import (
    EnqueteCreate, EnqueteUpdate, VotoCreate, EnqueteResponse,
    ComentarioCreate, ComentarioResponse,
)
from app.routers.auth import get_current_user
from app.models.profile import Profile
from pydantic import BaseModel


class RespostaCreate(BaseModel):
    texto: str

router = APIRouter(prefix="/api/enquetes", tags=["enquetes"])

OPCOES_BINARIA = ["Sim", "Não", "Abstenção"]
OPCOES_ESCALA = ["1", "2", "3", "4", "5"]


def _compute_result(enquete: Enquete, active_cotas: int) -> dict:
    if enquete.tipo == "texto":
        votantes_count = len(enquete.respostas) if enquete.respostas else 0
    else:
        votantes_count = len(enquete.votantes) if enquete.votantes else 0
    quorum_percent = round((votantes_count / active_cotas) * 100) if active_cotas > 0 else 0
    quorum_met = quorum_percent >= enquete.quorum_required

    approval_percent: int | None = None
    approved: bool | None = None

    votos = enquete.votos or {}

    if enquete.tipo == "binaria":
        sim = int(votos.get("0", 0))
        nao = int(votos.get("1", 0))
        validos = sim + nao
        if validos > 0:
            approval_percent = round((sim / validos) * 100)
        else:
            approval_percent = 0
        approved = quorum_met and approval_percent >= enquete.approval_threshold
    elif enquete.status in ("encerrada", "implementada", "arquivada"):
        # for multipla: any voting counts as "approved" if quorum met
        approved = quorum_met

    return {
        "quorum_percent": quorum_percent,
        "quorum_met": quorum_met,
        "approval_percent": approval_percent,
        "approved": approved,
    }


async def _active_cotas_count(db: AsyncSession) -> int:
    result = await db.execute(select(func.count()).select_from(Cota).where(Cota.ativo == True))
    return result.scalar_one() or 1


@router.get("", response_model=list[EnqueteResponse])
async def list_enquetes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).order_by(Enquete.created_at.desc()))
    enquetes = result.scalars().all()
    active_cotas = await _active_cotas_count(db)

    out = []
    for e in enquetes:
        data = EnqueteResponse.model_validate(e)
        computed = _compute_result(e, active_cotas)
        for k, v in computed.items():
            setattr(data, k, v)
        out.append(data)
    return out


@router.post("", response_model=EnqueteResponse, status_code=201)
async def create_enquete(data: EnqueteCreate, db: AsyncSession = Depends(get_db)):
    if data.tipo == "binaria":
        opcoes = OPCOES_BINARIA
    elif data.tipo == "escala":
        opcoes = OPCOES_ESCALA
    elif data.tipo == "texto":
        opcoes = []
    else:
        opcoes = data.opcoes
    if data.tipo == "multipla" and len(opcoes) < 2:
        raise HTTPException(status_code=422, detail="Mínimo 2 opções")
    votos = {str(i): 0 for i in range(len(opcoes))}
    _exclude = {"opcoes", "multipla_escolha", "status"}
    enquete = Enquete(
        **{k: v for k, v in data.model_dump().items() if k not in _exclude},
        opcoes=opcoes,
        votos=votos,
        votantes={},
        total_votos=0,
        multipla_escolha=(data.tipo == "multipla" and data.multipla_escolha),
        status=data.status or "aberta",
    )
    db.add(enquete)
    await db.commit()
    await db.refresh(enquete)

    db.add(Log(
        acao="enquete_criada",
        profile_slug=data.criador,
        descricao_incidente=f"Enquete criada: {enquete.titulo}",
    ))
    profiles_result = await db.execute(select(Profile).where(Profile.ativo == True))
    for p in profiles_result.scalars().all():
        db.add(Alert(
            tipo="enquete",
            profile_slug=p.slug,
            titulo=f"Nova enquete: {enquete.titulo}",
            mensagem="Uma nova enquete foi criada e aguarda sua participação.",
        ))
    await db.commit()

    active_cotas = await _active_cotas_count(db)
    response = EnqueteResponse.model_validate(enquete)
    for k, v in _compute_result(enquete, active_cotas).items():
        setattr(response, k, v)
    return response


@router.post("/{enquete_id}/votar", response_model=EnqueteResponse)
async def votar(
    enquete_id: str,
    data: VotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if enquete.status not in ("aberta", "votacao"):
        raise HTTPException(status_code=400, detail="Enquete não está aberta para votação")
    if data.opcao_index < 0 or data.opcao_index >= len(enquete.opcoes):
        raise HTTPException(status_code=400, detail="Opção inválida")

    if not current_user.cota_slug:
        raise HTTPException(status_code=400, detail="Usuário não pertence a uma bolinha")

    cota_slug = current_user.cota_slug
    votantes = dict(enquete.votantes)
    votos = dict(enquete.votos)

    if enquete.tipo == "binaria" or not enquete.multipla_escolha:
        if cota_slug in votantes:
            raise HTTPException(status_code=409, detail="Bolinha já votou nesta enquete")
        votantes[cota_slug] = [data.opcao_index]
    else:
        if cota_slug in votantes:
            if data.opcao_index in votantes[cota_slug]:
                raise HTTPException(status_code=409, detail="Bolinha já votou nesta opção")
            votantes[cota_slug].append(data.opcao_index)
        else:
            votantes[cota_slug] = [data.opcao_index]

    key = str(data.opcao_index)
    votos[key] = votos.get(key, 0) + 1

    enquete.votos = votos
    enquete.votantes = votantes
    enquete.total_votos = sum(votos.values())

    if enquete.tipo == "escala" and data.melhoria:
        respostas = dict(enquete.respostas or {})
        respostas[cota_slug] = data.melhoria[:300]
        enquete.respostas = respostas

    await db.commit()
    await db.refresh(enquete)

    active_cotas = await _active_cotas_count(db)
    response = EnqueteResponse.model_validate(enquete)
    for k, v in _compute_result(enquete, active_cotas).items():
        setattr(response, k, v)
    return response


@router.post("/{enquete_id}/responder", response_model=EnqueteResponse)
async def responder(
    enquete_id: str,
    data: RespostaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if enquete.tipo != "texto":
        raise HTTPException(status_code=400, detail="Enquete não é do tipo texto")
    if enquete.status not in ("aberta", "votacao"):
        raise HTTPException(status_code=400, detail="Enquete não está aberta para respostas")
    if not current_user.cota_slug:
        raise HTTPException(status_code=400, detail="Usuário não pertence a uma bolinha")

    cota_slug = current_user.cota_slug
    if cota_slug in (enquete.respostas or {}):
        raise HTTPException(status_code=409, detail="Bolinha já respondeu esta enquete")
    respostas = dict(enquete.respostas or {})
    respostas[cota_slug] = data.texto[:300]
    enquete.respostas = respostas

    await db.commit()
    await db.refresh(enquete)

    active_cotas = await _active_cotas_count(db)
    response = EnqueteResponse.model_validate(enquete)
    for k, v in _compute_result(enquete, active_cotas).items():
        setattr(response, k, v)
    return response


@router.put("/{enquete_id}", response_model=EnqueteResponse)
async def update_enquete(
    enquete_id: str,
    data: EnqueteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if not current_user.is_admin and enquete.criador != current_user.slug:
        raise HTTPException(status_code=403, detail="Apenas o criador ou um administrador pode editar esta enquete.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(enquete, key, value)
    await db.commit()
    await db.refresh(enquete)

    active_cotas = await _active_cotas_count(db)
    response = EnqueteResponse.model_validate(enquete)
    for k, v in _compute_result(enquete, active_cotas).items():
        setattr(response, k, v)
    return response


@router.delete("/{enquete_id}", status_code=204)
async def delete_enquete(
    enquete_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if not current_user.is_admin and enquete.criador != current_user.slug:
        raise HTTPException(status_code=403, detail="Apenas o criador ou um administrador pode excluir esta enquete.")
    await db.delete(enquete)
    await db.commit()


@router.get("/{enquete_id}/comentarios", response_model=list[ComentarioResponse])
async def list_comentarios(enquete_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EnqueteComentario)
        .where(EnqueteComentario.enquete_id == enquete_id)
        .order_by(EnqueteComentario.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{enquete_id}/comentarios", response_model=ComentarioResponse, status_code=201)
async def add_comentario(enquete_id: str, data: ComentarioCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Enquete not found")
    comentario = EnqueteComentario(enquete_id=enquete_id, **data.model_dump())
    db.add(comentario)
    await db.commit()
    await db.refresh(comentario)
    return comentario
