# =====================================================================
# Esquemas de validación de entrada (Pydantic)
# ---------------------------------------------------------------------
# Cada esquema define QUÉ datos espera la API por JSON y valida su
# FORMATO (tipos, campos obligatorios, email válido). Si algo no cuadra,
# Pydantic lanza ValidationError antes de llegar a la lógica de negocio.
# =====================================================================
from pydantic import BaseModel, EmailStr, Field


class RegisterUserSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    terms: bool
    years: bool

class VerifyEmailSchema(BaseModel):
    email: EmailStr
    code: str

class ResendCodeSchema(BaseModel):
    email: EmailStr

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginSchema(BaseModel):
    code: str = Field(..., min_length=1)

class ConfirmTermsSchema(BaseModel):
    terms_version: str = Field(default="v1.0", min_length=1)
