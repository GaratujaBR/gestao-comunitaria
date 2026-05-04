from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    nome: str
    slug: str


class RequestResetRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    nova_senha: str


class SetupRequest(BaseModel):
    email: str
    nova_senha: str
