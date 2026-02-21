from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.wiki_article import WikiArticle
from app.schemas.wiki_article import WikiArticleCreate, WikiArticleUpdate, WikiArticleResponse

router = APIRouter(prefix="/api/wiki", tags=["wiki"])


@router.get("", response_model=list[WikiArticleResponse])
async def list_articles(
    categoria: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(WikiArticle).order_by(WikiArticle.titulo)
    if categoria:
        query = query.where(WikiArticle.categoria == categoria)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{slug}", response_model=WikiArticleResponse)
async def get_article(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WikiArticle).where(WikiArticle.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("", response_model=WikiArticleResponse, status_code=201)
async def create_article(data: WikiArticleCreate, db: AsyncSession = Depends(get_db)):
    article = WikiArticle(**data.model_dump())
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article


@router.put("/{slug}", response_model=WikiArticleResponse)
async def update_article(slug: str, data: WikiArticleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WikiArticle).where(WikiArticle.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(article, key, value)
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/{slug}", status_code=204)
async def delete_article(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WikiArticle).where(WikiArticle.slug == slug))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await db.delete(article)
    await db.commit()
