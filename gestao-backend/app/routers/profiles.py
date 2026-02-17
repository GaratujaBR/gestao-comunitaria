from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse

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
async def update_profile(slug: str, data: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/{slug}", status_code=204)
async def delete_profile(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
