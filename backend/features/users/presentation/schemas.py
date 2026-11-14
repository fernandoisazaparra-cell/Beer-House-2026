# =====================================================================
# Esquemas de validación de entrada (Pydantic)
# ---------------------------------------------------------------------
# Cada esquema define QUÉ datos espera la API por JSON y valida su
# FORMATO (tipos, campos obligatorios, email válido). Si algo no cuadra,
# Pydantic lanza ValidationError antes de llegar a la lógica de negocio.
# =====================================================================
# =====================================================================
# Esquemas de validación de entrada (Pydantic)
# =====================================================================

from pydantic import BaseModel, EmailStr, Field


class RegisterUserSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=201)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    terms: bool
    years: bool


class VerifyEmailSchema(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResendCodeSchema(BaseModel):
    email: EmailStr


class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


class GoogleLoginSchema(BaseModel):
    code: str = Field(..., min_length=1, max_length=2048)


class ConfirmTermsSchema(BaseModel):
    terms_version: str = Field(
        default="v1.0",
        min_length=1,
        max_length=20
    )