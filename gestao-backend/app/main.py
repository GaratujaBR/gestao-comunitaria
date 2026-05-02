from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import engine, init_db
from app.routers import profiles, spaces, items, bookings, logs, wiki, alerts, chamados, prestadores, enquetes, sheets, cotas, eventos


@asynccontextmanager
async def lifespan(app: FastAPI):
    migrations = [
        "ALTER TABLE spaces ADD COLUMN parent_slug VARCHAR",
        "ALTER TABLE items ADD COLUMN tipo VARCHAR DEFAULT 'comum'",
        "ALTER TABLE profiles ADD COLUMN cota_slug VARCHAR",
        "ALTER TABLE bookings ADD COLUMN cota_slug VARCHAR",
        "ALTER TABLE profiles ADD COLUMN foto_url TEXT",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except OperationalError:
                pass  # column already exists
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
app.include_router(cotas.router)
app.include_router(eventos.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
