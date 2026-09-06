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

from .models import PendingRegistration, UserModel

# Caracteres para el código de verificación
# (se omiten las letras ambiguas: I, L, O, 0, 1)
CARACTERES_CODIGO = (
    "ABCDEFGHJKLMNPQRSTUVWXYZ"
    "abcdefghijkmnopqrstuvwxyz"
    "23456789"
)

# Un código de verificación dura 10 minutos
TIEMPO_EXPIRACION = timedelta(minutes=10)

def ahora_utc():
    """Fecha y hora actual en UTC. MySQL guarda 'sin zona horaria',
    por eso quitamos el offset para poder comparar con lo que se lee de la BD."""
    return datetime.now(UTC).replace(tzinfo=None)

def generar_codigo():
    """Genera un código de verificación de 6 caracteres aleatorios."""
    return "".join(secrets.choice(CARACTERES_CODIGO) for _ in range(6))

def hashear_codigo(codigo):
    """Convierte el código en un hash para no guardarlo en texto plano."""
    return generate_password_hash(codigo, method="pbkdf2:sha256")

class SQLAlchemyUserRepository:
    """Operaciones de la tabla 'users' y de los registros pendientes."""
    # ---------- Consultas básicas ----------
    def find_by_id(self, user_id):
        return UserModel.query.get(user_id)

    def find_by_email(self, email):
        return UserModel.query.filter_by(email=email).first()

    def find_pending_by_email(self, email):
        return PendingRegistration.query.filter_by(email=email).first()

    # ---------- Usuarios definitivos ----------
    def create_user(self, name, email, password):
        """Crea el usuario final (ya verificó su email)."""
        now = ahora_utc()
        model = UserModel(
            name=name,
            email=email,
            password=password,
            terms_accepted_at=now,
            age_confirmed_at=now,
            terms_version="v1.0",
        )
        db.session.add(model)
        db.session.commit()
        return model

    # ---------- Registros pendientes de verificación ----------
    def create_pending(self, name, email, password):
        """Guarda el registro pendiente y devuelve el código generado."""
        now = ahora_utc()
        codigo = generar_codigo()
        model = PendingRegistration(
            name=name,
            email=email,
            password=password,
            terms_accepted_at=now,
            age_confirmed_at=now,
            terms_version="v1.0",
            code_hash=hashear_codigo(codigo),
            attempts_used=0,
            created_at=now,
            expires_at=now + TIEMPO_EXPIRACION,
            locked_until=None,
        )
        db.session.add(model)
        db.session.commit()
        return codigo

    def refresh_pending(self, pending, name=None, password=None):
        """Regenera el código y vuelve a darle 10 minutos de validez.
        Se usa al re-registrarse y para reenviar el código."""
        now = ahora_utc()
        codigo = generar_codigo()

        if name is not None:
            pending.name = name
        if password is not None:
            pending.password = password

        pending.code_hash = hashear_codigo(codigo)
        pending.attempts_used = 0
        pending.locked_until = None
        pending.created_at = now
        pending.expires_at = now + TIEMPO_EXPIRACION
        db.session.commit()
        return codigo

    def register_failed_attempt(self, pending):
        """Apunta un intento fallido; al llegar a 5 bloquea 15 minutos."""
        pending.attempts_used += 1
        if pending.attempts_used >= 5:
            pending.locked_until = ahora_utc() + timedelta(minutes=15)
        db.session.commit()

    def delete_pending(self, pending):
        db.session.delete(pending)
        db.session.commit()

    def delete_expired_pendings(self):
        """Borra los pendientes cuyo código ya expiró. Devuelve cuántos borró."""
        eliminados = PendingRegistration.query.filter(
            PendingRegistration.expires_at < ahora_utc()
        ).delete(synchronize_session=False)
        db.session.commit()
        return eliminados

    # ---------- Bloqueo por intentos fallidos de login ----------
    def register_failed_login(self, user):
        """Apunta un intento de login fallido; al llegar a 5 bloquea 15 minutos."""
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = ahora_utc() + timedelta(minutes=15)
        db.session.commit()

    def reset_failed_logins(self, user):
        """Limpia los intentos fallidos tras un login correcto."""
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()

    # ---------- Login con Google ----------
    def find_by_google_id(self, google_id):
        return UserModel.query.filter_by(google_id=google_id).first()

    def link_google_account(self, user, google_id):
        """Vincula una cuenta local existente con su Google ID."""
        user.google_id = google_id
        db.session.commit()
        return user

    def create_google_user(self, name, email, google_id):
        """Crea un usuario nuevo a partir de un login con Google (sin password)."""
        model = UserModel(
            name=name,
            email=email,
            password=None,
            google_id=google_id,
            terms_accepted_at=None,
            age_confirmed_at=None,
        )
        db.session.add(model)
        db.session.commit()
        return model

    def confirm_terms_and_age(self, user, terms_version):
        """Se llama cuando el usuario de Google confirma edad y términos."""
        now = ahora_utc()
        user.terms_accepted_at = now
        user.age_confirmed_at = now
        user.terms_version = terms_version
        db.session.commit()
        return user