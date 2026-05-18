from contextlib import asynccontextmanager
import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, init_db
from app.routers import (
    auth,
    profiles,
    spaces,
    items,
    bookings,
    logs,
    wiki,
    alerts,
    chamados,
    prestadores,
    enquetes,
    sheets,
    cotas,
    eventos,
)
from app.routers.auth import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    migrations = [
        "ALTER TABLE spaces ADD COLUMN parent_slug VARCHAR",
        "ALTER TABLE items ADD COLUMN tipo VARCHAR DEFAULT 'comum'",
        "ALTER TABLE profiles ADD COLUMN cota_slug VARCHAR",
        "ALTER TABLE bookings ADD COLUMN cota_slug VARCHAR",
        "ALTER TABLE profiles ADD COLUMN foto_url TEXT",
        "ALTER TABLE enquetes ADD COLUMN tipo VARCHAR DEFAULT 'multipla'",
        "ALTER TABLE enquetes ADD COLUMN quorum_required INTEGER DEFAULT 60",
        "ALTER TABLE enquetes ADD COLUMN approval_threshold INTEGER DEFAULT 66",
        "ALTER TABLE enquetes ADD COLUMN closes_at TIMESTAMP",
        "ALTER TABLE enquetes ADD COLUMN voting_starts_at TIMESTAMP",
        "ALTER TABLE enquetes ADD COLUMN result_action TEXT",
        "ALTER TABLE enquetes ADD COLUMN respostas JSON DEFAULT '{}'",
        """CREATE TABLE IF NOT EXISTS enquete_comentarios (
            id VARCHAR PRIMARY KEY,
            enquete_id VARCHAR NOT NULL REFERENCES enquetes(id) ON DELETE CASCADE,
            autor VARCHAR NOT NULL,
            conteudo TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        "ALTER TABLE bookings ADD COLUMN evento_id VARCHAR",
        "ALTER TABLE eventos ADD COLUMN publico BOOLEAN DEFAULT TRUE",
        "ALTER TABLE enquetes ADD COLUMN anonima BOOLEAN DEFAULT FALSE",
        "ALTER TABLE profiles ADD COLUMN senha_hash TEXT",
        "ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                # SQLite "duplicate column" e PostgreSQL "already exists" são esperados
                err_msg = str(e).lower()
                if "duplicate column" in err_msg or "already exists" in err_msg or "relation" in err_msg:
                    continue  # coluna/tabela já existe
                # Loga erros reais de migração em vez de engolir silenciosamente
                import logging
                logging.warning(f"Migration warning: {e}")
    await init_db()
    yield


app = FastAPI(title="Gestao Comunitaria API", lifespan=lifespan)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router, dependencies=[Depends(get_current_user)])
app.include_router(spaces.router, dependencies=[Depends(get_current_user)])
app.include_router(items.router, dependencies=[Depends(get_current_user)])
app.include_router(bookings.router, dependencies=[Depends(get_current_user)])
app.include_router(logs.router, dependencies=[Depends(get_current_user)])
app.include_router(wiki.router, dependencies=[Depends(get_current_user)])
app.include_router(alerts.router, dependencies=[Depends(get_current_user)])
app.include_router(chamados.router, dependencies=[Depends(get_current_user)])
app.include_router(prestadores.router, dependencies=[Depends(get_current_user)])
app.include_router(enquetes.router, dependencies=[Depends(get_current_user)])
app.include_router(sheets.router, dependencies=[Depends(get_current_user)])
app.include_router(cotas.router, dependencies=[Depends(get_current_user)])
app.include_router(eventos.router, dependencies=[Depends(get_current_user)])


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
