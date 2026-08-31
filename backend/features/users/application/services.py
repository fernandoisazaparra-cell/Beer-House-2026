# =====================================================================
# Lógica de negocio del usuario (registro + verificación por email)
# ---------------------------------------------------------------------
# Un "servicio" coordina: validar datos (validators) + hablar con la
# base de datos (repository). No sabe nada de HTTP ni de Flask.
# =====================================================================
from werkzeug.security import check_password_hash, generate_password_hash

from ..domain.validators import validar_codigo, validar_usuario
from ..infrastructure.repository import SQLAlchemyUserRepository, ahora_utc

class UserService:
    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def register(self, name, email, password, terms, years):
        """
        Crea un registro pendiente de verificación.
        Devuelve (codigo, errores):
          - codigo: el código de 6 caracteres para enviar por email.
          - errores: {campo: [mensajes]}. Vacío si todo salió bien.
        """
        datos, errores = validar_usuario(name, email, password, terms, years)
        if errores:
            return None, errores

        password_hash = generate_password_hash(datos["password"], method="pbkdf2:sha256")
        email = datos["email"]

        # Si el email ya está en la tabla 'users', no se puede registar de nuevo
        if self.repository.find_by_email(email):
            return None, {"email": ["El email ya está registrado"]}

        pendiente = self.repository.find_pending_by_email(email)
        if pendiente:
            # Ya había un intento: se regenera el código y se actualizan los datos
            codigo = self.repository.refresh_pending(
                pendiente,
                name=datos["name"],
                password=password_hash,
            )
        else:
            codigo = self.repository.create_pending(datos["name"], email, password_hash)
        return codigo, None

    def verify_email(self, email, code):
        """
        Comprueba el código y, si es correcto, crea el usuario definitivo.
        Devuelve errores (dict) o None si todo salió bien.
        """
        datos, errores = validar_codigo(email, code)
        if errores:
            return errores

        pendiente = self.repository.find_pending_by_email(datos["email"])
        if not pendiente:
            raise ValueError("No existe una verificación pendiente")

        now = ahora_utc()

        # ¿Bloqueado por muchos intentos fallidos?
        if pendiente.locked_until and now < pendiente.locked_until:
            return {"code": [
                "Has superado el número máximo de intentos. Intenta nuevamente más tarde."
            ]}

        # ¿Expiró el código (10 minutos)?
        if now > pendiente.expires_at:
            return {"code": ["El código de verificación ha expirado"]}

        # ¿El código es incorrecto?
        if not check_password_hash(pendiente.code_hash, datos["code"]):
            self.repository.register_failed_attempt(pendiente)
            return {"code": ["El código de verificación es incorrecto"]}

        # Todo bien: pasamos el pendiente a usuario definitivo
        self.repository.delete_pending(pendiente)
        self.repository.create_user(
            pendiente.name,
            pendiente.email,
            pendiente.password,
        )
        return None

    def re_send_code(self, email):
        """Reenvía el código de verificación a un email pendiente.

        Devuelve (codigo, errores) con el nuevo código generado.
        """
        email = (email or "").strip().lower()
        if not email:
            return None, {"email": ["El email es obligatorio"]}

        pendiente = self.repository.find_pending_by_email(email)
        if not pendiente:
            raise ValueError("No existe una verificación pendiente")

        codigo = self.repository.refresh_pending(pendiente)
        return codigo, None

def limpiar_registros_expirados():
    """Borra registros pendientes con el código expirado. Lo usa el scheduler."""
    repository = SQLAlchemyUserRepository()
    return repository.delete_expired_pendings()