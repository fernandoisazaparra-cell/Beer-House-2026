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
import re
from datetime import date, datetime
from threading import Thread

import requests
from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from app.email.email_service import EmailError, EmailService
from app.extensions import db, limiter
from shared.security.decorators import current_user, login_required, role_required
from shared.security.password import hash_password
from shared.security.roles import ADMIN, SUPERVISOR, USER

from ..application.services import UserService
from ..application.services_auth import AuthService
from ..infrastructure.models import ProfileUpdateRequest
from ..infrastructure.repository import (
    SQLAlchemyUserRepository,
    UserHasTransactions,
    ahora_utc,
)
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


def find_token_user(service, payload):
    """
    Resuelve al usuario del token por id (identificador estable) y,
    si no existe, por el email emitido. Así un cambio de correo no
    invalida la sesión actual.
    """
    user = None
    if payload.get("user_id"):
        user = service.repository.find_by_id(payload["user_id"])

    return user or service.repository.find_by_email(payload.get("email"))


MSG_INVALID_JSON = "Body JSON inválido o vacío"
MSG_NO_TOKEN = "Token no proporcionado"
MSG_USER_NOT_FOUND = "Usuario no encontrado"
MSG_REQUEST_NOT_FOUND = "Solicitud no encontrada o ya procesada"

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
ROL_VALUES = (ADMIN, SUPERVISOR, USER)


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
    
    # Capturar birth_date tanto del esquema de Pydantic como del data crudo
    birth_date = getattr(schema, "birth_date", data.get("birth_date"))

    codigo, errores = service.register(
        schema.name,
        schema.email,
        schema.password,
        schema.terms,
        schema.years,
        birth_date=birth_date,  # <--- Integración de la fecha de nacimiento
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


@auth_bp.post("/logout")
@limiter.limit("10 per minute")
@login_required
def logout():
    """Cierra la sesión en el servidor invalidando el JWT actual (RI-008)."""
    repo.revoke_tokens(current_user())
    return {"message": "Sesión cerrada correctamente."}, 200


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

    user = find_token_user(service, payload)
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

    user = find_token_user(service, payload)
    if not user:
        return {"message": MSG_USER_NOT_FOUND}, 404

    # Validar antes de registrar o aplicar cualquier cambio (CP-024 / CP-025).
    errores = {}

    nuevo_email = None
    if "email" in data:
        nuevo_email = str(data.get("email") or "").strip().lower()
        if not EMAIL_RE.fullmatch(nuevo_email):
            errores["email"] = ["El correo no tiene un formato válido."]
        else:
            existente = service.repository.find_by_email(nuevo_email)
            if existente and existente.id != user.id:
                errores["email"] = ["El email ya está registrado."]

    nueva_fecha = None
    if "birth_date" in data and data["birth_date"]:
        try:
            nueva_fecha = datetime.strptime(
                str(data["birth_date"]), "%Y-%m-%d"
            ).date()
        except ValueError:
            errores["birth_date"] = [
                "El formato de la fecha debe ser AAAA-MM-DD."
            ]
        else:
            hoy = date.today()
            if nueva_fecha > hoy:
                errores["birth_date"] = [
                    "La fecha de nacimiento no puede ser futura."
                ]
            else:
                edad = hoy.year - nueva_fecha.year - (
                    (hoy.month, hoy.day) < (nueva_fecha.month, nueva_fecha.day)
                )
                if edad < 18:
                    errores["birth_date"] = [
                        "Debes ser mayor de 18 años."
                    ]

    for campo in ("first_name", "last_name"):
        if campo in data and not str(data[campo] or "").strip():
            errores[campo] = ["Este campo es obligatorio."]

    if errores:
        return {"errors": errores}, 400

    fecha_registro = (
        getattr(user, "created_at", None)
        or user.terms_accepted_at
        or user.age_confirmed_at
    )
    if fecha_registro is None:
        return {
            "status": "rejected",
            "message": "No se pudo determinar la antigüedad de la cuenta.",
        }, 403
    if fecha_registro.tzinfo is not None:
        fecha_registro = fecha_registro.replace(tzinfo=None)
    dias_antiguedad = (ahora_utc() - fecha_registro).days

    # RN-002: solo se puede actualizar después de 30 días.
    if dias_antiguedad < 30:
        return {
            "status": "rejected",
            "message": (
                f"Tu cuenta fue creada hace {dias_antiguedad} días. "
                "Debes esperar 30 días para actualizar tus datos."
            ),
            "days_registered": dias_antiguedad,
        }, 403

    # RN-002: toda actualización se registra como "pendiente" y el sistema
    # la valida automáticamente (formato y correo único) antes de aplicarla.
    solicitud = ProfileUpdateRequest(
        user_id=user.id,
        requested_first_name=str(
            data.get("first_name", user.first_name)
        ).strip(),
        requested_last_name=str(
            data.get("last_name", user.last_name)
        ).strip(),
        requested_birth_date=nueva_fecha or user.birth_date,
        requested_email=nuevo_email or user.email,
        status="pending",
        created_at=ahora_utc(),
    )
    db.session.add(solicitud)
    db.session.commit()

    errores_auto = {}
    if not EMAIL_RE.fullmatch(str(solicitud.requested_email or "")):
        errores_auto["email"] = ["El correo no tiene un formato válido."]
    else:
        duplicado = service.repository.find_by_email(solicitud.requested_email)
        if duplicado and duplicado.id != user.id:
            errores_auto["email"] = ["El email ya está registrado."]

    if not solicitud.requested_first_name:
        errores_auto["first_name"] = ["Este campo es obligatorio."]
    if not solicitud.requested_last_name:
        errores_auto["last_name"] = ["Este campo es obligatorio."]

    if errores_auto:
        solicitud.status = "rejected"
        solicitud.processed_at = ahora_utc()
        db.session.commit()
        return {
            "status": "rejected",
            "message": "La solicitud no pasó la validación automática.",
            "errors": errores_auto,
            "request_id": solicitud.id,
        }, 400

    user.first_name = solicitud.requested_first_name
    user.last_name = solicitud.requested_last_name
    user.birth_date = solicitud.requested_birth_date
    user.email = solicitud.requested_email

    solicitud.status = "approved"
    solicitud.processed_at = ahora_utc()
    db.session.commit()

    return {
        "status": "success",
        "message": (
            "Solicitud validada automáticamente y perfil actualizado correctamente."
        ),
        "request_id": solicitud.id,
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
@role_required(ADMIN)
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
            "requested_email": req.requested_email,
            "created_at": req.created_at.isoformat(),
        })
    return {"requests": resultado}, 200


@auth_bp.post("/admin/profile-requests/<int:request_id>/approve")
@role_required(ADMIN)
def approve_profile_request(request_id):
    solicitud = ProfileUpdateRequest.query.get(request_id)
    if not solicitud or solicitud.status != "pending":
        return {"message": MSG_REQUEST_NOT_FOUND}, 404

    user = solicitud.user
    email_solicitado = solicitud.requested_email or user.email
    duplicado = repo.find_by_email(email_solicitado)
    if duplicado and duplicado.id != user.id:
        return {"message": "El correo solicitado ya está registrado."}, 409

    user.first_name = solicitud.requested_first_name
    user.last_name = solicitud.requested_last_name
    user.email = email_solicitado
    if solicitud.requested_birth_date:
        user.birth_date = solicitud.requested_birth_date

    solicitud.status = "approved"
    solicitud.processed_at = ahora_utc()

    db.session.commit()
    return {"message": "Solicitud aprobada y perfil actualizado con éxito"}, 200


@auth_bp.post("/admin/profile-requests/<int:request_id>/reject")
@role_required(ADMIN)
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
@role_required(ADMIN)
def get_users():
    try:
        users = repo.get_all_users()
        resultado = [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "email": u.email,
                "rol": u.rol,
                "estado": "Activo" if u.age_confirmed_at else "Pendiente",
            }
            for u in users
        ]
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": "Error al listar usuarios", "details": str(e)}), 500


@users_bp.post("/")
@role_required(ADMIN)
def create_user():
    try:
        data = request.get_json(silent=True) or {}
        name = str(data.get("name") or "").strip()
        email = str(data.get("email") or "").strip().lower()
        password = data.get("password")
        rol = data.get("rol") or USER

        if not name or not email or not password:
            return jsonify({
                "error": "Faltan datos obligatorios (name, email, password)"
            }), 400

        if rol not in ROL_VALUES:
            return jsonify({
                "error": "Rol inválido. Use admin, supervisor o user."
            }), 400

        if not EMAIL_RE.fullmatch(email):
            return jsonify({
                "error": "El correo no tiene un formato válido."
            }), 400

        if repo.find_by_email(email):
            return jsonify({"error": "El email ya está registrado."}), 400

        partes = name.split(" ", 1)
        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Cliente"

        hashed_password = hash_password(password)
        new_user = repo.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
            rol=rol,
        )

        return jsonify({
            "message": "Usuario creado con éxito",
            "id": new_user.id,
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al crear usuario", "details": str(e)}), 500


@users_bp.put("/<int:user_id>")
@role_required(ADMIN)
def update_user(user_id):
    try:
        data = request.get_json(silent=True) or {}

        if "rol" in data and data["rol"] not in ROL_VALUES:
            return jsonify({
                "error": "Rol inválido. Use admin, supervisor o user."
            }), 400

        if "email" in data:
            email = str(data["email"] or "").strip().lower()
            if not EMAIL_RE.fullmatch(email):
                return jsonify({
                    "error": "El correo no tiene un formato válido."
                }), 400

        repo.update_user_admin(user_id, data)
        return jsonify({"message": "Usuario actualizado con éxito"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al actualizar usuario", "details": str(e)}), 500


@users_bp.delete("/<int:user_id>")
@role_required(ADMIN)
def delete_user(user_id):
    try:
        response = repo.delete_user_admin(user_id)
        return jsonify(response), 200
    except UserHasTransactions as ve:
        return jsonify({"error": str(ve)}), 409
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar usuario", "details": str(e)}), 500