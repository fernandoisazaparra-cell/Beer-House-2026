# =====================================================================
# Acceso a la base de datos (todo con el ORM de SQLAlchemy)
# ---------------------------------------------------------------------
# "Repositorio" = la clase que sabe GUARDAR y CONSULTAR los modelos.
# Los servicios llaman a estas funciones; aquí nunca se escribe SQL crudo.
# =====================================================================


import secrets
from datetime import UTC, datetime, timedelta

from werkzeug.security import generate_password_hash

from app.extensions import db
from shared.security.password import hash_password

from .models import PendingRegistration, ProfileUpdateRequest, UserModel


User = UserModel


class UserHasTransactions(ValueError):
    """El usuario tiene transacciones y no puede eliminarse (RN-004)."""


CARACTERES_CODIGO = (
    "ABCDEFGHJKLMNPQRSTUVWXYZ"
    "abcdefghijkmnopqrstuvwxyz"
    "23456789"
)

TIEMPO_EXPIRACION = timedelta(minutes=10)
MAX_INTENTOS = 5
TIEMPO_BLOQUEO = timedelta(minutes=15)


def ahora_utc():
    """Devuelve la fecha actual UTC sin zona horaria."""
    return datetime.now(UTC).replace(tzinfo=None)


def generar_codigo():
    """Genera un código de verificación aleatorio de 6 caracteres."""
    return "".join(
        secrets.choice(CARACTERES_CODIGO)
        for _ in range(6)
    )


def hashear_codigo(codigo):
    """Almacena el código como hash."""
    return generate_password_hash(
        codigo,
        method="pbkdf2:sha256"
    )


class SQLAlchemyUserRepository:
    """Repositorio de usuarios y registros pendientes."""

    # ---------------------------------------------------------
    # CONSULTAS
    # ---------------------------------------------------------

    def find_by_id(self, user_id):
        return db.session.get(UserModel, user_id)

    def find_by_email(self, email):
        email = (email or "").strip().lower()
        return UserModel.query.filter_by(email=email).first()

    def find_pending_by_email(self, email):
        email = (email or "").strip().lower()
        return PendingRegistration.query.filter_by(email=email).first()

    # ---------------------------------------------------------
    # USUARIOS DEFINITIVOS
    # ---------------------------------------------------------

    def create_user(
        self, first_name, last_name, email, password, rol="user"
    ):
        now = ahora_utc()

        try:
            model = UserModel(
                first_name=first_name,
                last_name=last_name,
                email=email.strip().lower(),
                password=password,
                rol=rol,
                terms_accepted_at=now,
                age_confirmed_at=now,
                terms_version="v1.0",
                created_at=now,
            )

            db.session.add(model)
            db.session.commit()

            return model

        except Exception:
            db.session.rollback()
            raise

    def rehash_password(self, user, plain_password):
        """Actualiza un hash legacy a bcrypt tras un login correcto (RNF-010)."""
        user.password = hash_password(plain_password)
        db.session.commit()
        return user

    def revoke_tokens(self, user):
        """Invalida todos los tokens emitidos para este usuario (RI-008)."""
        user.token_version = (user.token_version or 0) + 1
        db.session.commit()
        return user

    # ---------------------------------------------------------
    # REGISTROS PENDIENTES
    # ---------------------------------------------------------

    def create_pending(self, first_name, last_name, email, password, birth_date=None):
        now = ahora_utc()
        codigo = generar_codigo()

        try:
            model = PendingRegistration(
                first_name=first_name,
                last_name=last_name,
                email=email.strip().lower(),
                password=password,
                terms_accepted_at=now,
                age_confirmed_at=now,
                terms_version="v1.0",
                code_hash=hashear_codigo(codigo),
                attempts_used=0,
                created_at=now,
                expires_at=now + TIEMPO_EXPIRACION,
                locked_until=None,
                birth_date=birth_date,
            )

            db.session.add(model)
            db.session.commit()

            return codigo

        except Exception:
            db.session.rollback()
            raise

    def refresh_pending(
        self,
        pending,
        first_name=None,
        last_name=None,
        password=None
    ):
        """Regenera el código sin permitir evadir bloqueos activos."""

        now = ahora_utc()

        if pending.locked_until and now < pending.locked_until:
            raise ValueError(
                "La verificación está bloqueada temporalmente. "
                "Intenta nuevamente más tarde."
            )

        codigo = generar_codigo()

        try:
            if first_name is not None:
                pending.first_name = first_name

            if last_name is not None:
                pending.last_name = last_name

            if password is not None:
                pending.password = password

            pending.code_hash = hashear_codigo(codigo)
            pending.attempts_used = 0
            pending.locked_until = None
            pending.created_at = now
            pending.expires_at = now + TIEMPO_EXPIRACION

            db.session.commit()

            return codigo

        except Exception:
            db.session.rollback()
            raise

    def register_failed_attempt(self, pending):
        """Registra intentos fallidos de verificación."""

        try:
            pending.attempts_used += 1

            if pending.attempts_used >= MAX_INTENTOS:
                pending.locked_until = ahora_utc() + TIEMPO_BLOQUEO

            db.session.commit()

        except Exception:
            db.session.rollback()
            raise

    def confirm_pending_registration(self, pending):
        """
        Convierte un registro pendiente en usuario definitivo
        dentro de una sola transacción.
        """

        try:
            user = UserModel(
                first_name=pending.first_name,
                last_name=pending.last_name,
                email=pending.email,
                password=pending.password,
                birth_date=pending.birth_date,
                terms_accepted_at=pending.terms_accepted_at,
                age_confirmed_at=pending.age_confirmed_at,
                terms_version=pending.terms_version,
            )

            db.session.add(user)
            db.session.delete(pending)
            db.session.commit()

            return user

        except Exception:
            db.session.rollback()
            raise
    
    def delete_pending(self, pending):
        try:
            db.session.delete(pending)
            db.session.commit()

        except Exception:
            db.session.rollback()
            raise

    def delete_expired_pendings(self):
        """Elimina registros pendientes cuyo código expiró."""

        try:
            eliminados = PendingRegistration.query.filter(
                PendingRegistration.expires_at < ahora_utc()
            ).delete(synchronize_session=False)

            db.session.commit()

            return eliminados

        except Exception:
            db.session.rollback()
            raise

    # ---------------------------------------------------------
    # BLOQUEO DE INICIO DE SESIÓN
    # ---------------------------------------------------------

    def register_failed_login(self, user):
        try:
            now = ahora_utc()

            if user.locked_until and now >= user.locked_until:
                user.failed_login_attempts = 0
                user.locked_until = None

            user.failed_login_attempts += 1

            if user.failed_login_attempts >= MAX_INTENTOS:
                user.locked_until = now + TIEMPO_BLOQUEO

            db.session.commit()

        except Exception:
            db.session.rollback()
            raise

    def reset_failed_logins(self, user):
        try:
            user.failed_login_attempts = 0
            user.locked_until = None

            db.session.commit()

        except Exception:
            db.session.rollback()
            raise

    # ---------------------------------------------------------
    # LOGIN CON GOOGLE
    # ---------------------------------------------------------

    def find_by_google_id(self, google_id):
        return UserModel.query.filter_by(
            google_id=google_id
        ).first()

    def link_google_account(self, user, google_id):
        try:
            user.google_id = google_id
            db.session.commit()
            return user

        except Exception:
            db.session.rollback()
            raise

    def create_google_user(
        self,
        first_name,
        last_name,
        email,
        google_id
    ):
        try:
            model = UserModel(
                first_name=first_name,
                last_name=last_name,
                email=email.strip().lower(),
                password=None,
                google_id=google_id,
                terms_accepted_at=None,
                age_confirmed_at=None,
            )

            db.session.add(model)
            db.session.commit()

            return model

        except Exception:
            db.session.rollback()
            raise

    def confirm_terms_and_age(self, user, terms_version):
        try:
            now = ahora_utc()

            user.terms_accepted_at = now
            user.age_confirmed_at = now
            user.terms_version = terms_version

            db.session.commit()

            return user

        except Exception:
            db.session.rollback()
            raise

    # ---------------------------------------------------------
    # CRUD ADMINISTRACIÓN
    # ---------------------------------------------------------

    def get_all_users(self):
        return UserModel.query.order_by(
            UserModel.id.desc()
        ).all()

    def update_user_admin(self, user_id, data):
        user = db.session.get(UserModel, user_id)

        if not user:
            raise ValueError("Usuario no encontrado.")

        try:
            if "name" in data:
                nombre = (data["name"] or "").strip()

                if not nombre:
                    raise ValueError("El nombre no puede estar vacío.")

                partes = nombre.split(" ", 1)
                user.first_name = partes[0]
                user.last_name = partes[1] if len(partes) > 1 else ""

            if "email" in data:
                email = (data["email"] or "").strip().lower()

                if not email:
                    raise ValueError("El email no puede estar vacío.")

                existente = UserModel.query.filter(
                    UserModel.email == email,
                    UserModel.id != user.id
                ).first()

                if existente:
                    raise ValueError("El email ya está registrado.")

                user.email = email

            if "rol" in data:
                rol = data["rol"]
                if rol not in ("admin", "supervisor", "user"):
                    raise ValueError("Rol inválido.")
                user.rol = rol

            if "password" in data and data["password"]:
                user.password = hash_password(data["password"])

            db.session.commit()

            return user

        except Exception:
            db.session.rollback()
            raise

    def delete_user_admin(self, user_id):
        from features.customers.infrastructure.models import (
            CustomerInteractionModel,
        )
        from features.purchases.infrastructure.models import (
            CustomerOrderModel,
            PaymentTransactionModel,
            PurchaseOrderModel,
        )
        from features.sales.infrastructure.models import SaleModel

        user = db.session.get(UserModel, user_id)

        if not user:
            raise ValueError("Usuario no encontrado.")

        # RN-004: un usuario con movimientos no puede borrarse (CP-029).
        relacionados = (
            ("ventas", SaleModel),
            ("pedidos", CustomerOrderModel),
            ("compras", PurchaseOrderModel),
            ("pagos", PaymentTransactionModel),
            ("interacciones", CustomerInteractionModel),
            ("solicitudes de perfil", ProfileUpdateRequest),
        )
        for nombre, modelo in relacionados:
            columna = getattr(modelo, "user_id", None)
            if columna is None:
                continue

            if db.session.query(modelo).filter(columna == user.id).first():
                raise UserHasTransactions(
                    "No se puede eliminar el usuario porque tiene "
                    f"{nombre} asociadas. Cancela esas transacciones o "
                    "desactiva la cuenta antes de eliminarla."
                )

        try:
            db.session.delete(user)
            db.session.commit()

            return {
                "message": "Usuario eliminado exitosamente"
            }

        except Exception:
            db.session.rollback()
            raise
