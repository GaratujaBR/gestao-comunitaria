from contextlib import asynccontextmanager
from fastapi import FastAPI
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
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except Exception:
                pass  # column/table already exists
    await init_db()
    yield


app = FastAPI(title="Gestao Comunitaria API", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(spaces.router)
app.include_router(items.router)
app.include_router(bookings.router)
app.include_router(logs.router)
app.include_router(wiki.router)
app.include_router(alerts.router)
app.include_router(chamados.router)
app.include_router(prestadores.router)
app.include_router(enquetes.router)
app.include_router(sheets.router)
app.include_router(cotas.router)
app.include_router(eventos.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
