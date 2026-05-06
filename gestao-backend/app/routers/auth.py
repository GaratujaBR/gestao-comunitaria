import os
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.profile import Profile
from app.schemas.auth import (
    LoginRequest,
    RequestResetRequest,
    ResetPasswordRequest,
    SetupRequest,
    TokenResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
RESET_TOKEN_EXPIRE_HOURS = 1

APP_URL = os.getenv("APP_URL", "http://localhost:5173/terradecanaa")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@terradecanaa.org")

def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _make_token(payload: dict, expire_delta: timedelta) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + expire_delta
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


async def _send_email(to: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.email == data.email))
    profile = result.scalar_one_or_none()

    if not profile or not profile.senha_hash:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not _verify(data.senha, profile.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not profile.ativo:
        raise HTTPException(status_code=403, detail="Perfil inativo.")

    token = _make_token(
        {"sub": profile.slug, "email": profile.email, "nome": profile.nome_curto or profile.nome_completo, "role": profile.role, "is_admin": profile.is_admin},
        timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )
    return TokenResponse(
        access_token=token,
        nome=profile.nome_curto or profile.nome_completo,
        slug=profile.slug,
        role=profile.role,
        is_admin=profile.is_admin,
    )


@router.post("/request-reset", status_code=204)
async def request_reset(data: RequestResetRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.email == data.email))
    profile = result.scalar_one_or_none()

    if not profile or not profile.email:
        return  # silenciar — não vazar se email existe

    token = _make_token(
        {"sub": profile.slug, "purpose": "reset"},
        timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
    )
    link = f"{APP_URL}/definir-senha?token={token}"
    nome = profile.nome_curto or profile.nome_completo

    await _send_email(
        to=profile.email,
        subject="Terra de Canaã — Acesso ao App",
        html=f"""
        <p>Olá, {nome}!</p>
        <p>Clique no link abaixo para definir sua senha de acesso ao app do Vilarejo:</p>
        <p><a href="{link}" style="color:#1F6B3A;font-weight:bold">Definir minha senha</a></p>
        <p style="color:#8A8A8A;font-size:12px">Este link expira em 1 hora.</p>
        """,
    )


@router.post("/reset-password", status_code=204)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado.")

    if payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Token inválido.")

    slug = payload.get("sub")
    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")

    if len(data.nova_senha) < 6:
        raise HTTPException(status_code=422, detail="Senha deve ter no mínimo 6 caracteres.")

    profile.senha_hash = _hash(data.nova_senha)
    await db.commit()


@router.post("/setup", status_code=204)
async def setup(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Define senha de um perfil que ainda não tem senha. Torna-se inútil após uso."""
    result = await db.execute(select(Profile).where(Profile.email == data.email))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    if profile.senha_hash:
        raise HTTPException(status_code=409, detail="Perfil já possui senha definida.")
    if len(data.nova_senha) < 6:
        raise HTTPException(status_code=422, detail="Senha deve ter no mínimo 6 caracteres.")
    profile.senha_hash = _hash(data.nova_senha)
    await db.commit()


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> Profile:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido.")

    token = auth_header[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    slug = payload.get("sub")
    if not slug:
        raise HTTPException(status_code=401, detail="Token inválido.")

    result = await db.execute(select(Profile).where(Profile.slug == slug))
    profile = result.scalar_one_or_none()
    if not profile or not profile.ativo:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo.")

    return profile
