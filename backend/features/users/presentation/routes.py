# =====================================================================
# Rutas de autenticación (la "capa HTTP")
# ---------------------------------------------------------------------
# Una ruta hace 4 cosas simples, en orden:
#   1) Leer el JSON que llega por la petición.
#   2) Validar el FORMATO con un schema (Pydantic).
#   3) Llamar al servicio, que valida reglas y habla con la BD.
#   4) Convertir el resultado en una respuesta JSON.
# =====================================================================
from threading import Thread

from flask import Blueprint, request
from pydantic import ValidationError

from app.email.email_service import EmailError, EmailService
from app.extensions import limiter

from ..application.services import UserService
from ..application.services_auth import AuthService
from .schemas import (
    LoginSchema,
    RegisterUserSchema,
    ResendCodeSchema,
    VerifyEmailSchema,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

def errores_pydantic(validation_error):
    """Convierte los errores de Pydantic en {campo: [mensajes]}."""
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        if campo == "email" and error["type"].startswith("value_error"):
            mensaje = "El email no tiene un formato válido"
        else:
            mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores

def enviar_codigo_por_email(destinatario, codigo, nombre=None):
    """Envía el correo con el código. Si falla, solo lo imprime (no rompe el registro)."""
    try:
        EmailService().send_email(
            recipient=destinatario,
            subject="Bienvenido a Beer House",
            template_name="registrer.html",
            context={"code": codigo, "name": nombre or ""},
        )
    except EmailError as error:
        print(f"Error enviando correo: {error}")

def enviar_codigo_en_background(destinatario, codigo, nombre=None):
    """Envía el correo en un hilo aparte para no hacer esperar al usuario."""
    Thread(
        target=enviar_codigo_por_email,
        args=(destinatario, codigo, nombre),
        daemon=True,
    ).start()

@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = RegisterUserSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    codigo, errores = service.register(
        schema.name,
        schema.email,
        schema.password,
        schema.terms,
        schema.years,
    )
    if errores:
        return {"errors": errores}, 400

    enviar_codigo_en_background(schema.email, codigo, schema.name)
    return {"message": "Usuario registrado correctamente"}, 201

@auth_bp.post("/verify-email")
@limiter.limit("10 per minute")
def verify_email():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = VerifyEmailSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    try:
        errores = service.verify_email(schema.email, schema.code)
    except ValueError as error:
        return {"message": str(error)}, 400

    if errores:
        return {"errors": errores}, 400

    return {"message": "Correo verificado correctamente"}, 200

@auth_bp.post("/token-repeat")
@limiter.limit("5 per hour")
def token_repeat():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = ResendCodeSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    try:
        codigo, errores = service.re_send_code(schema.email)
    except ValueError as error:
        return {"message": str(error)}, 400

    if errores:
        return {"errors": errores}, 400

    enviar_codigo_en_background(schema.email, codigo)
    return {"message": "Código reenviado. Revisa tu correo."}, 200

@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = LoginSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = AuthService()
    try:
        resultado = service.login(schema.email, schema.password)
    except ValueError as error:
        return {"message": str(error)}, 400

    return resultado, 200

@auth_bp.get("/me")
@limiter.limit("10 per minute")
def me():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return {"message": "Token no proporcionado"}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    user = service.repository.find_by_email(payload["email"])
    if not user:
        return {"message": "Usuario no encontrado"}, 404

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "rol": user.rol,
        }
    }, 200