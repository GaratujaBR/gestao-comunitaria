from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.enquete import Enquete
from app.schemas.enquete import EnqueteCreate, EnqueteUpdate, EnqueteResponse, VotoCreate

router = APIRouter(prefix="/api/enquetes", tags=["enquetes"])


def _to_response(enquete: Enquete) -> dict:
    votos = enquete.votos or {}
    total = sum(votos.values())
    return {
        "id": enquete.id,
        "titulo": enquete.titulo,
        "descricao": enquete.descricao,
        "categoria": enquete.categoria,
        "opcoes": enquete.opcoes,
        "votos": votos,
        "votantes": enquete.votantes or {},
        "criador": enquete.criador,
        "status": enquete.status,
        "multipla_escolha": enquete.multipla_escolha,
        "total_votos": total,
        "data_encerramento": enquete.data_encerramento,
        "created_at": enquete.created_at,
        "updated_at": enquete.updated_at,
    }


@router.get("", response_model=list[EnqueteResponse])
async def list_enquetes(
    status: str | None = Query(None),
    categoria: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Enquete).order_by(Enquete.created_at.desc())
    if status:
        query = query.where(Enquete.status == status)
    if categoria:
        query = query.where(Enquete.categoria == categoria)
    result = await db.execute(query)
    enquetes = result.scalars().all()
    return [_to_response(e) for e in enquetes]


@router.get("/{enquete_id}", response_model=EnqueteResponse)
async def get_enquete(enquete_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    return _to_response(enquete)


@router.post("", response_model=EnqueteResponse, status_code=201)
async def create_enquete(data: EnqueteCreate, db: AsyncSession = Depends(get_db)):
    if len(data.opcoes) < 2:
        raise HTTPException(status_code=400, detail="Enquete precisa de pelo menos 2 opções")

    votos = {str(i): 0 for i in range(len(data.opcoes))}

    enquete = Enquete(
        titulo=data.titulo,
        descricao=data.descricao,
        categoria=data.categoria,
        opcoes=data.opcoes,
        votos=votos,
        votantes={},
        criador=data.criador,
        multipla_escolha=data.multipla_escolha,
        data_encerramento=data.data_encerramento,
    )
    db.add(enquete)
    await db.commit()
    await db.refresh(enquete)
    return _to_response(enquete)


@router.post("/{enquete_id}/votar", response_model=EnqueteResponse)
async def votar(enquete_id: str, data: VotoCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if enquete.status != "aberta":
        raise HTTPException(status_code=400, detail="Enquete está encerrada")
    if data.opcao_index < 0 or data.opcao_index >= len(enquete.opcoes):
        raise HTTPException(status_code=400, detail="Opção inválida")

    votantes = dict(enquete.votantes or {})
    votos = dict(enquete.votos or {})
    idx = str(data.opcao_index)

    if data.votante in votantes:
        if not enquete.multipla_escolha:
            raise HTTPException(status_code=400, detail="Você já votou nesta enquete")
        if data.opcao_index in votantes[data.votante]:
            raise HTTPException(status_code=400, detail="Você já votou nesta opção")
        votantes[data.votante].append(data.opcao_index)
    else:
        votantes[data.votante] = [data.opcao_index]

    votos[idx] = votos.get(idx, 0) + 1

    enquete.votos = votos
    enquete.votantes = votantes
    await db.commit()
    await db.refresh(enquete)
    return _to_response(enquete)


@router.put("/{enquete_id}", response_model=EnqueteResponse)
async def update_enquete(enquete_id: str, data: EnqueteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if data.status:
        enquete.status = data.status
    await db.commit()
    await db.refresh(enquete)
    return _to_response(enquete)


@router.delete("/{enquete_id}", status_code=204)
async def delete_enquete(enquete_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    await db.delete(enquete)
    await db.commit()
