# =====================================================================
# Lógica de negocio del usuario (registro + verificación por email)
# ---------------------------------------------------------------------
# Un "servicio" coordina: validar datos (validators) + hablar con la
# base de datos (repository). No sabe nada de HTTP ni de Flask.
# =====================================================================
# =====================================================================
# Lógica de negocio del usuario (registro + verificación por email + CRUD Admin)
# =====================================================================

from werkzeug.security import (
    check_password_hash,
    generate_password_hash
)

from ..domain.validators import (
    validar_codigo,
    validar_usuario as validar_usuario_original
)

from ..infrastructure.repository import (
    SQLAlchemyUserRepository,
    ahora_utc
)


class UserService:

    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def register(self, name, email, password, terms, years):
        """
        Crea o actualiza un registro pendiente de verificación.

        Devuelve:
            (codigo, errores)

        codigo:
            Código de seis caracteres para enviar por email.

        errores:
            Diccionario de errores o None si el registro fue correcto.
        """

        datos, errores = validar_usuario_original(
            name,
            email,
            password,
            terms,
            years
        )

        if errores:
            return None, errores

        email = datos["email"]

        # Comprobar si ya existe un usuario definitivo.
        if self.repository.find_by_email(email):
            return None, {
                "email": ["El email ya está registrado"]
            }

        partes = datos["name"].split(" ", 1)

        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Cliente"

        password_hash = generate_password_hash(
            datos["password"],
            method="pbkdf2:sha256"
        )

        pendiente = self.repository.find_pending_by_email(email)

        try:
            if pendiente:
                codigo = self.repository.refresh_pending(
                    pendiente,
                    first_name=first_name,
                    last_name=last_name,
                    password=password_hash
                )
            else:
                codigo = self.repository.create_pending(
                    first_name,
                    last_name,
                    email,
                    password_hash
                )

        except ValueError as error:
            return None, {
                "email": [str(error)]
            }

        return codigo, None

    def verify_email(self, email, code):
        """
        Verifica el código y convierte el registro pendiente
        en un usuario definitivo.
        """

        datos, errores = validar_codigo(email, code)

        if errores:
            return errores

        pendiente = self.repository.find_pending_by_email(
            datos["email"]
        )

        if not pendiente:
            raise ValueError(
                "No existe una verificación pendiente"
            )

        now = ahora_utc()

        if pendiente.locked_until and now < pendiente.locked_until:
            return {
                "code": [
                    "Has superado el número máximo de intentos. "
                    "Intenta nuevamente más tarde."
                ]
            }

        if now > pendiente.expires_at:
            return {
                "code": [
                    "El código de verificación ha expirado"
                ]
            }

        if not check_password_hash(
            pendiente.code_hash,
            datos["code"]
        ):
            self.repository.register_failed_attempt(pendiente)

            return {
                "code": [
                    "El código de verificación es incorrecto"
                ]
            }

        # Este método debe crear el usuario y eliminar el pendiente
        # dentro de una única transacción.
        self.repository.confirm_pending_registration(pendiente)

        return None

    def re_send_code(self, email):
        """
        Genera y devuelve un nuevo código para un registro pendiente.
        No permite saltarse un bloqueo temporal.
        """

        email = (email or "").strip().lower()

        if not email:
            return None, {
                "email": ["El email es obligatorio"]
            }

        pendiente = self.repository.find_pending_by_email(email)

        if not pendiente:
            raise ValueError(
                "No existe una verificación pendiente"
            )

        try:
            codigo = self.repository.refresh_pending(pendiente)

        except ValueError as error:
            return None, {
                "email": [str(error)]
            }

        return codigo, None


def limpiar_registros_expirados():
    """
    Elimina los registros pendientes cuyo código ha expirado.
    """

    repository = SQLAlchemyUserRepository()

    return repository.delete_expired_pendings()


class UserServiceCRUD:
    """
    Servicio para administrar usuarios desde el panel.
    """

    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def list_users(self):
        users = self.repository.get_all_users()

        return [
            {
                "id": user.id,
                "name": (
                    f"{user.first_name or ''} "
                    f"{user.last_name or ''}"
                ).strip(),
                "email": user.email
            }
            for user in users
        ]

    def create_user(self, data):
        """
        Crea un usuario desde administración.
        La contraseña debe venir explícitamente en los datos.
        """

        if not isinstance(data, dict):
            raise ValueError("Los datos del usuario no son válidos")

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")

        if not name:
            raise ValueError("El nombre es obligatorio")

        if not email:
            raise ValueError("El email es obligatorio")

        if not isinstance(password, str) or not password:
            raise ValueError("La contraseña es obligatoria")

        partes = name.split(" ", 1)

        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Cliente"

        hashed_password = generate_password_hash(
            password,
            method="pbkdf2:sha256"
        )

        return self.repository.create_user(
            first_name,
            last_name,
            email,
            hashed_password
        )

    def update_user(self, user_id, data):
        return self.repository.update_user_admin(
            user_id,
            data
        )

    def delete_user(self, user_id):
        return self.repository.delete_user_admin(user_id)
