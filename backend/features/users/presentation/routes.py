"""
Rutas de autenticación y gestión de usuarios (capa HTTP)

Secciones:
    1. Imports y configuración
    2. Helpers
    3. Registro y verificación de correo
    4. Login (correo y Google)
    5. Sesión y términos
    6. Perfil del usuario
    7. Administración de solicitudes de perfil
    8. CRUD de usuarios (panel admin)
"""

# ==========================================
# 1. IMPORTS Y CONFIGURACIÓN
# ==========================================

import os
from threading import Thread

import requests
from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from werkzeug.security import generate_password_hash

from app.email.email_service import EmailError, EmailService
from app.extensions import db, limiter
from shared.security.decorators import role_required
from shared.security.roles import STAFF_ROLES

from ..application.services import UserService
from ..application.services_auth import AuthService
from ..infrastructure.models import ProfileUpdateRequest
from ..infrastructure.repository import SQLAlchemyUserRepository, ahora_utc
from .schemas import (
    ConfirmTermsSchema,
    GoogleLoginSchema,
    LoginSchema,
    RegisterUserSchema,
    ResendCodeSchema,
    VerifyEmailSchema,
)

auth_bp = Blueprint("auth", __name__)
users_bp = Blueprint("users_admin", __name__)

repo = SQLAlchemyUserRepository()

MSG_INVALID_JSON = "Body JSON inválido o vacío"
MSG_NO_TOKEN = "Token no proporcionado"
MSG_USER_NOT_FOUND = "Usuario no encontrado"
MSG_REQUEST_NOT_FOUND = "Solicitud no encontrada o ya procesada"


# ==========================================
# 2. HELPERS
# ==========================================

def errores_pydantic(validation_error):
    """Convierte los errores de Pydantic a {campo: [mensajes]}."""
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        if campo == "email" and error["type"].startswith("value_error"):
            mensaje = "El email no tiene un formato válido"
        else:
            mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


def get_bearer_token():
    """Extrae el token del header Authorization (vacío si no viene)."""
    return request.headers.get("Authorization", "").replace("Bearer ", "")


def enviar_codigo_por_email(destinatario, codigo, nombre=None):
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
    Thread(
        target=enviar_codigo_por_email,
        args=(destinatario, codigo, nombre),
        daemon=True,
    ).start()


# ==========================================
# 3. REGISTRO Y VERIFICACIÓN DE CORREO
# ==========================================

@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": MSG_INVALID_JSON}, 400

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
        return {"message": MSG_INVALID_JSON}, 400

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
        return {"message": MSG_INVALID_JSON}, 400

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


# ==========================================
# 4. LOGIN (CORREO Y GOOGLE)
# ==========================================

@auth_bp.route("/login", methods=["POST", "OPTIONS"])
@limiter.limit("10 per minute")
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True)
    if data is None:
        return {"message": MSG_INVALID_JSON}, 400

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


# NOTA: el orden de estos decoradores se dejó igual que el original.
# Con @limiter.limit encima de @auth_bp.post, el límite probablemente
# NO se aplica. Para activarlo, invertir el orden.
@limiter.limit("10 per minute")
@auth_bp.post("/token-google")
def login_google():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": MSG_INVALID_JSON}, 400

    try:
        schema = GoogleLoginSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": schema.code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code",
        },
    )

    if not token_response.ok:
        return {
            "message": "No se pudo validar el código con Google",
            "detail": token_response.json(),
        }, 400

    tokens = token_response.json()
    id_token_jwt = tokens.get("id_token")

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_jwt,
            google_requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID"),
        )
    except ValueError:
        return {"message": "Token de Google inválido"}, 400

    email = idinfo.get("email")
    name = idinfo.get("name")
    google_id = idinfo.get("sub")

    if not email or not google_id:
        return {"message": "Token de Google incompleto (falta email o sub)"}, 400

    service = AuthService()
    try:
        resultado = service.login_google(google_id, email, name)
    except ValueError as error:
        return {"message": str(error)}, 400

    return resultado, 200


# ==========================================
# 5. SESIÓN Y TÉRMINOS
# ==========================================

@auth_bp.post("/confirm-terms")
@limiter.limit("10 per minute")
def confirm_terms():
    token = get_bearer_token()
    if not token:
        return {"message": MSG_NO_TOKEN}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    data = request.get_json(silent=True)
    if data is None:
        return {"message": MSG_INVALID_JSON}, 400

    try:
        schema = ConfirmTermsSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    try:
        service.confirm_terms_and_age(payload["user_id"], schema.terms_version)
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"message": "Términos y edad confirmados correctamente"}, 200


@auth_bp.get("/me")
@limiter.limit("10 per minute")
def me():
    token = get_bearer_token()
    if not token:
        return {"message": MSG_NO_TOKEN}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    user = service.repository.find_by_email(payload["email"])
    if not user:
        return {"message": MSG_USER_NOT_FOUND}, 404

    return {
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "email": user.email,
            "rol": user.rol,
        },
        "requires_confirmation": user.age_confirmed_at is None,
    }, 200


# ==========================================
# 6. PERFIL DEL USUARIO
# ==========================================

@auth_bp.put("/profile")
@limiter.limit("10 per minute")
def update_profile():
    token = get_bearer_token()
    if not token:
        return {"message": MSG_NO_TOKEN}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    data = request.get_json(silent=True)
    if not data:
        return {"message": MSG_INVALID_JSON}, 400

    user = service.repository.find_by_email(payload["email"])
    if not user:
        return {"message": MSG_USER_NOT_FOUND}, 404

    fecha_registro = (
        getattr(user, "created_at", None)
        or user.terms_accepted_at
        or user.age_confirmed_at
    )
    dias_antiguedad = (ahora_utc() - fecha_registro).days if fecha_registro else 0

    # Cuentas con menos de 30 días: el cambio queda pendiente de aprobación
    if dias_antiguedad < 30:
        nueva_solicitud = ProfileUpdateRequest(
            user_id=user.id,
            requested_first_name=data.get("first_name", user.first_name),
            requested_last_name=data.get("last_name", user.last_name),
            requested_birth_date=(
                data.get("birth_date") if "birth_date" in data else user.birth_date
            ),
            status="pending",
        )
        db.session.add(nueva_solicitud)
        db.session.commit()

        return {
            "status": "pending_approval",
            "message": (
                f"Tu cuenta fue creada hace {dias_antiguedad} días. "
                "Tu solicitud de actualización quedó registrada."
            ),
            "days_registered": dias_antiguedad,
            "request_id": nueva_solicitud.id,
        }, 202

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    if "birth_date" in data:
        user.birth_date = data["birth_date"]

    db.session.commit()

    return {
        "status": "success",
        "message": "Perfil actualizado correctamente.",
        "user": {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        },
    }, 200


# ==========================================
# 7. ADMINISTRACIÓN DE SOLICITUDES DE PERFIL
# ==========================================

@auth_bp.get("/admin/profile-requests")
@role_required(*STAFF_ROLES)
def get_profile_requests():
    solicitudes = ProfileUpdateRequest.query.filter_by(status="pending").all()
    resultado = []
    for req in solicitudes:
        resultado.append({
            "id": req.id,
            "user_id": req.user_id,
            "current_name": f"{req.user.first_name} {req.user.last_name}",
            "user_email": req.user.email,
            "requested_first_name": req.requested_first_name,
            "requested_last_name": req.requested_last_name,
            "requested_birth_date": (
                req.requested_birth_date.isoformat()
                if req.requested_birth_date else None
            ),
            "created_at": req.created_at.isoformat(),
        })
    return {"requests": resultado}, 200


@auth_bp.post("/admin/profile-requests/<int:request_id>/approve")
@role_required(*STAFF_ROLES)
def approve_profile_request(request_id):
    solicitud = ProfileUpdateRequest.query.get(request_id)
    if not solicitud or solicitud.status != "pending":
        return {"message": MSG_REQUEST_NOT_FOUND}, 404

    user = solicitud.user
    user.first_name = solicitud.requested_first_name
    user.last_name = solicitud.requested_last_name
    if solicitud.requested_birth_date:
        user.birth_date = solicitud.requested_birth_date

    solicitud.status = "approved"
    solicitud.processed_at = ahora_utc()

    db.session.commit()
    return {"message": "Solicitud aprobada y perfil actualizado con éxito"}, 200


@auth_bp.post("/admin/profile-requests/<int:request_id>/reject")
@role_required(*STAFF_ROLES)
def reject_profile_request(request_id):
    solicitud = ProfileUpdateRequest.query.get(request_id)
    if not solicitud or solicitud.status != "pending":
        return {"message": MSG_REQUEST_NOT_FOUND}, 404

    solicitud.status = "rejected"
    solicitud.processed_at = ahora_utc()

    db.session.commit()
    return {"message": "Solicitud rechazada correctamente"}, 200


# ==========================================
# 8. CRUD DE USUARIOS (PANEL ADMIN)
# ==========================================

@users_bp.get("/")
@role_required(*STAFF_ROLES)
def get_users():
    try:
        users = repo.get_all_users()
        resultado = [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "email": u.email,
            }
            for u in users
        ]
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": "Error al listar usuarios", "details": str(e)}), 500


@users_bp.post("/")
@role_required(*STAFF_ROLES)
def create_user():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({
                "error": "Faltan datos obligatorios (name, email, password)"
            }), 400

        partes = name.split(" ", 1)
        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Cliente"

        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = repo.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
        )

        return jsonify({"message": "Usuario creado con éxito", "id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al crear usuario", "details": str(e)}), 500


@users_bp.put("/<int:user_id>")
@role_required(*STAFF_ROLES)
def update_user(user_id):
    try:
        data = request.get_json()
        repo.update_user_admin(user_id, data)
        return jsonify({"message": "Usuario actualizado con éxito"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al actualizar usuario", "details": str(e)}), 500


@users_bp.delete("/<int:user_id>")
@role_required(*STAFF_ROLES)
def delete_user(user_id):
    try:
        response = repo.delete_user_admin(user_id)
        return jsonify(response), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar usuario", "details": str(e)}), 500