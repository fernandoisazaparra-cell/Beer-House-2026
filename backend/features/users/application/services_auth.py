# =====================================================================
# Servicio de autenticación: login + tokens JWT
# ---------------------------------------------------------------------
# Aquí se crea y se valida el token que el usuario usa en cada petición
# (endpoint /auth/me). El token asegura "esta persona ya está logueada".
# =====================================================================
# =====================================================================
# Servicio de autenticación: login + tokens JWT
# =====================================================================

from datetime import UTC, datetime, timedelta

import jwt
from werkzeug.security import check_password_hash

from config.settings import Config

from ..infrastructure.repository import (
    SQLAlchemyUserRepository,
    ahora_utc
)


class AuthService:

    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def login(self, email, password):
        """
        Comprueba las credenciales y devuelve un token JWT.
        """

        user = self.repository.find_by_email(email)

        if not user:
            raise ValueError("Credenciales inválidas")

        # Comprobar bloqueo temporal.
        if user.locked_until and ahora_utc() < user.locked_until:
            raise ValueError(
                "Cuenta bloqueada temporalmente. "
                "Intenta nuevamente más tarde."
            )

        # Los usuarios registrados exclusivamente mediante Google
        # pueden no tener contraseña local.
        if not user.password:
            raise ValueError("Credenciales inválidas")

        if not check_password_hash(user.password, password):
            self.repository.register_failed_login(user)
            raise ValueError("Credenciales inválidas")

        self.repository.reset_failed_logins(user)

        token = self.generate_token(user.id, user.email)

        full_name = (
            f"{user.first_name or ''} "
            f"{user.last_name or ''}"
        ).strip()

        return {
            "token": token,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "name": full_name,
                "email": user.email,
                "rol": user.rol,
            },
        }

    def login_google(self, google_id: str, email: str, name: str):
        """
        Busca o crea un usuario a partir de los datos
        previamente verificados de Google.
        """

        user = self.repository.find_by_google_id(google_id)

        if not user:
            # Buscar una cuenta local con el mismo correo.
            user = self.repository.find_by_email(email)

            if user:
                user = self.repository.link_google_account(
                    user,
                    google_id
                )
            else:
                # Separar el nombre completo.
                partes_nombre = (
                    name.strip().split(" ", 1)
                    if name and name.strip()
                    else ["", ""]
                )

                first_name = partes_nombre[0]
                last_name = (
                    partes_nombre[1]
                    if len(partes_nombre) > 1
                    else ""
                )

                if not first_name:
                    raise ValueError(
                        "Google no proporcionó un nombre válido"
                    )

                user = self.repository.create_google_user(
                    first_name,
                    last_name,
                    email,
                    google_id
                )

        token = self.generate_token(user.id, user.email)

        full_name = (
            f"{user.first_name or ''} "
            f"{user.last_name or ''}"
        ).strip()

        return {
            "token": token,
            "requires_confirmation": user.age_confirmed_at is None,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "name": full_name,
                "email": user.email,
                "rol": user.rol,
            },
        }

    def confirm_terms_and_age(self, user_id, terms_version="v1.0"):
        """
        Registra la aceptación de términos y la confirmación de edad.
        """

        user = self.repository.find_by_id(user_id)

        if not user:
            raise ValueError("Usuario no encontrado")

        self.repository.confirm_terms_and_age(
            user,
            terms_version
        )

    def generate_token(self, user_id, email):
        """
        Genera un JWT con fecha de emisión y expiración.
        """

        issued_at = datetime.now(UTC)

        payload = {
            "user_id": user_id,
            "email": email,
            "iat": issued_at,
            "exp": issued_at + timedelta(
                hours=Config.JWT_EXPIRATION_HOURS
            ),
        }

        return jwt.encode(
            payload,
            Config.JWT_SECRET,
            algorithm="HS256"
        )

    def decode_token(self, token):
        """
        Decodifica y valida un JWT.
        """

        if not token or not isinstance(token, str):
            raise ValueError("Token inválido")

        try:
            return jwt.decode(
                token,
                Config.JWT_SECRET,
                algorithms=["HS256"]
            )

        except jwt.ExpiredSignatureError:
            raise ValueError("Token expirado") from None

        except jwt.InvalidTokenError:
            raise ValueError("Token inválido") from None