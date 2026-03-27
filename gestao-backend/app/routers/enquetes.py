from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.enquete import Enquete
from app.schemas.enquete import EnqueteCreate, EnqueteUpdate, VotoCreate, EnqueteResponse

router = APIRouter(prefix="/api/enquetes", tags=["enquetes"])


@router.get("", response_model=list[EnqueteResponse])
async def list_enquetes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).order_by(Enquete.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=EnqueteResponse, status_code=201)
async def create_enquete(data: EnqueteCreate, db: AsyncSession = Depends(get_db)):
    votos = {str(i): 0 for i in range(len(data.opcoes))}
    enquete = Enquete(
        **data.model_dump(),
        votos=votos,
        votantes={},
        total_votos=0,
    )
    db.add(enquete)
    await db.commit()
    await db.refresh(enquete)
    return enquete


@router.post("/{enquete_id}/votar", response_model=EnqueteResponse)
async def votar(enquete_id: str, data: VotoCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    if enquete.status != "aberta":
        raise HTTPException(status_code=400, detail="Enquete encerrada")
    if data.opcao_index < 0 or data.opcao_index >= len(enquete.opcoes):
        raise HTTPException(status_code=400, detail="Opção inválida")

    votantes = dict(enquete.votantes)
    votos = dict(enquete.votos)

    if not enquete.multipla_escolha and data.votante in votantes:
        raise HTTPException(status_code=400, detail="Você já votou nesta enquete")

    if data.votante in votantes:
        if data.opcao_index in votantes[data.votante]:
            raise HTTPException(status_code=400, detail="Você já votou nesta opção")
        votantes[data.votante].append(data.opcao_index)
    else:
        votantes[data.votante] = [data.opcao_index]

    key = str(data.opcao_index)
    votos[key] = votos.get(key, 0) + 1

    enquete.votos = votos
    enquete.votantes = votantes
    enquete.total_votos = sum(votos.values())

    await db.commit()
    await db.refresh(enquete)
    return enquete


@router.put("/{enquete_id}", response_model=EnqueteResponse)
async def update_enquete(enquete_id: str, data: EnqueteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(enquete, key, value)
    await db.commit()
    await db.refresh(enquete)
    return enquete


@router.delete("/{enquete_id}", status_code=204)
async def delete_enquete(enquete_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Enquete).where(Enquete.id == enquete_id))
    enquete = result.scalar_one_or_none()
    if not enquete:
        raise HTTPException(status_code=404, detail="Enquete not found")
    await db.delete(enquete)
    await db.commit()
