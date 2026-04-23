import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")

# Supabase/Render fornece "postgresql://..." — converter para driver async
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg_async://", 1)
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg_async://", 1)
elif os.path.exists("/data"):
    DATABASE_URL = "sqlite+aiosqlite:////data/app.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
