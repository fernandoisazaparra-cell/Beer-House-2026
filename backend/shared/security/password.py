"""Hashing de contraseñas (RNF-010: bcrypt con salt).

Werkzeug 3.x ya no incluye el método "bcrypt" en generate_password_hash,
por eso se usa la librería bcrypt directamente. Los hashes antiguos
(pbkdf2:scrypt de Werkzeug) siguen siendo verificables y se migran a
bcrypt en el siguiente inicio de sesión correcto.
"""

import bcrypt
from werkzeug.security import check_password_hash

BCRYPT_PREFIX = "bcrypt$"


def hash_password(password: str) -> str:
    """Genera un hash bcrypt con salt aleatorio."""
    if not isinstance(password, str) or not password:
        raise ValueError("La contraseña es obligatoria")
    digest = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return f"{BCRYPT_PREFIX}{digest.decode('ascii')}"


def verify_password(password_hash: str | None, password: str) -> bool:
    if not password_hash or not isinstance(password, str):
        return False
    if password_hash.startswith(BCRYPT_PREFIX):
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                password_hash[len(BCRYPT_PREFIX):].encode("ascii"),
            )
        except (ValueError, TypeError):
            return False
    # Compatibilidad con contraseñas creadas antes de este cambio.
    return check_password_hash(password_hash, password)


def needs_rehash(password_hash: str | None) -> bool:
    """True si el hash guardado no es bcrypt (contraseñas legacy)."""
    return not password_hash or not password_hash.startswith(BCRYPT_PREFIX)
