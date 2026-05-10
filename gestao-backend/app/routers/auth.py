import os
import re
import uuid
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
    RegisterRequest,
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

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

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


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Cadastro público de novo usuário. Cria perfil com senha já definida."""
    if len(data.senha) < 6:
        raise HTTPException(status_code=422, detail="Senha deve ter no mínimo 6 caracteres.")

    # Verificar se email já existe
    result = await db.execute(select(Profile).where(Profile.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email já cadastrado.")

    # Gerar slug
    base_slug = re.sub(r"[^a-z0-9-]+", "", (data.slug or data.nome_completo).lower().strip().replace(" ", "-"))
    slug = base_slug
    counter = 2
    while True:
        result = await db.execute(select(Profile).where(Profile.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    profile = Profile(
        slug=slug,
        nome_completo=data.nome_completo,
        nome_curto=data.nome_curto,
        email=data.email,
        telefone=data.telefone,
        senha_hash=_hash(data.senha),
        ativo=True,
        is_admin=False,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)


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

    # Tentar verificar como token Supabase primeiro
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"{SUPABASE_URL}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": SUPABASE_ANON_KEY,
                    },
                    timeout=10,
                )
                if res.status_code == 200:
                    user_data = res.json()
                    email = user_data.get("email")
                    if email:
                        result = await db.execute(select(Profile).where(Profile.email == email))
                        profile = result.scalar_one_or_none()
                        if profile and profile.ativo:
                            return profile
                        # Auto-criar perfil se existe no Supabase mas não no backend
                        if not profile:
                            nome_completo = user_data.get("user_metadata", {}).get("nome_completo") or email.split("@")[0]
                            base_slug = re.sub(r"[^a-z0-9-]+", "", nome_completo.lower().strip().replace(" ", "-"))
                            slug = base_slug
                            counter = 2
                            while True:
                                result = await db.execute(select(Profile).where(Profile.slug == slug))
                                if not result.scalar_one_or_none():
                                    break
                                slug = f"{base_slug}-{counter}"
                                counter += 1
                            profile = Profile(
                                id=str(uuid.uuid4()),
                                slug=slug,
                                nome_completo=nome_completo,
                                email=email,
                                ativo=True,
                                is_admin=False,
                            )
                            db.add(profile)
                            await db.commit()
                            await db.refresh(profile)
                            return profile
        except Exception:
            pass

    # Fallback: verificar como token JWT local legado
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


@router.get("/me", response_model=TokenResponse)
async def me(profile: Profile = Depends(get_current_user)):
    """Retorna os dados do perfil autenticado, sincronizando is_admin com o Supabase."""
    return TokenResponse(
        access_token="",  # não precisa retornar token
        nome=profile.nome_curto or profile.nome_completo,
        slug=profile.slug,
        role=profile.role,
        is_admin=profile.is_admin,
    )
