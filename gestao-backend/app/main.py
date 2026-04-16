from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import engine, init_db
from app.routers import profiles, spaces, items, bookings, logs, wiki, alerts, chamados, prestadores, enquetes, sheets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrations inline (sem Alembic)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE spaces ADD COLUMN parent_slug VARCHAR"))
        except OperationalError:
            pass  # coluna já existe
    await init_db()
    yield


app = FastAPI(title="Gestao Comunitaria API", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
