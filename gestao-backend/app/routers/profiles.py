from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileResponse])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).order_by(Profile.nome_completo))
    return result.scalars().all()


@router.get("/{slug}", response_model=ProfileResponse)
async def get_profile(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("", response_model=ProfileResponse, status_code=201)
async def create_profile(data: ProfileCreate, db: AsyncSession = Depends(get_db)):
    profile = Profile(**data.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.put("/{slug}", response_model=ProfileResponse)
async def update_profile(
    slug: str,
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if current_user.slug != slug and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Apenas o próprio usuário ou um administrador pode alterar este perfil.")
    update_data = data.model_dump(exclude_unset=True)
    if not current_user.is_admin:
        update_data.pop("is_admin", None)
        update_data.pop("ativo", None)
    for key, value in update_data.items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/{slug}", status_code=204)
async def delete_profile(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Profile = Depends(get_current_user),
):
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if current_user.slug != slug and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Apenas o próprio usuário ou um administrador pode excluir este perfil.")
    await db.delete(profile)
    await db.commit()
