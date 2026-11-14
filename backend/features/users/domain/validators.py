# =====================================================================
# Reglas de negocio de los datos del usuario
# ---------------------------------------------------------------------
# Estas funciones SOLO validan y normalizan datos. No hablan con la
# base de datos, no saben nada de HTTP ni de Flask. Por eso son
# fáciles de leer, probar y reutilizar.
#
# Convención: cada función devuelve (datos_normalizados, errores).
#   - errores vacío {}  -> todo está bien.
#   - errores con datos -> {campo: [mensajes]} para mostrarlos en el front.
# =====================================================================

# =====================================================================
# Reglas de negocio de los datos del usuario
# =====================================================================

import re
from datetime import date

CONTRASENAS_COMUNES = {
    "password1",
    "password123",
    "12345678",
    "123456789",
    "admin123",
    "welcome1",
    "contraseña",
    "qwerty123",
    "secret123",
}

PATRONES_SECUENCIA = [
    r"0123|1234|2345|3456|4567|5678|6789",
    r"9876|8765|7654|6543|5432|4321|3210",
    r"(\d)\1{3,}",
]

PATRON_NOMBRE = re.compile(
    r"[^\W\d_]+(?:[ '-][^\W\d_]+)*",
    re.UNICODE
)

PATRON_EMAIL = re.compile(
    r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
)

PATRON_CODIGO = re.compile(r"^[A-Za-z2-9]{6}$")


def normalizar_nombre(nombre):
    """Normaliza espacios, mayúsculas y minúsculas."""

    return " ".join(
        "'".join(
            "-".join(
                palabra.capitalize()
                for palabra in trozo.split("-")
            )
            for trozo in parte.split("'")
        )
        for parte in nombre.strip().split()
    )


def validar_usuario(name, email, password, terms, years):
    """
    Valida y normaliza los datos de registro.

    Devuelve:
        (datos, errores)
    """

    errores = {}

    name = name if isinstance(name, str) else ""
    email = email if isinstance(email, str) else ""
    password = password if isinstance(password, str) else ""

    # ---------------------------------------------------------
    # VALIDACIÓN DE DATOS ORIGINALES
    # ---------------------------------------------------------

    if name and not PATRON_NOMBRE.fullmatch(name.strip()):
        errores.setdefault("name", []).append(
            "El nombre contiene caracteres no permitidos."
        )

    if password and any(c.isspace() for c in password):
        errores.setdefault("password", []).append(
            "La contraseña no puede contener espacios."
        )

    # ---------------------------------------------------------
    # NORMALIZACIÓN
    # ---------------------------------------------------------

    name = normalizar_nombre(name) if name.strip() else ""
    email = email.strip().lower()

    # No modificar silenciosamente la contraseña.
    password_minus = password.lower()

    letras_nombre = name.replace(" ", "")
    palabras_nombre = name.split()

    es_secuencia_obvia = any(
        re.search(patron, password)
        for patron in PATRONES_SECUENCIA
    )

    # ---------------------------------------------------------
    # NOMBRE
    # ---------------------------------------------------------

    if not name:
        errores.setdefault("name", []).append(
            "El nombre es obligatorio."
        )

    if any(len(palabra) < 2 for palabra in palabras_nombre):
        errores.setdefault("name", []).append(
            "Cada nombre o apellido debe tener al menos 2 letras."
        )

    if len(letras_nombre) < 3:
        errores.setdefault("name", []).append(
            "El nombre es demasiado corto."
        )

    if len(name) > 100:
        errores.setdefault("name", []).append(
            "El nombre es demasiado largo."
        )

    if name.startswith(("-", "'")) or name.endswith(("-", "'")):
        errores.setdefault("name", []).append(
            "El nombre no puede comenzar ni terminar con guion o apóstrofe."
        )

    if "--" in name or "''" in name:
        errores.setdefault("name", []).append(
            "El nombre contiene separadores consecutivos no permitidos."
        )

    # ---------------------------------------------------------
    # EMAIL
    # ---------------------------------------------------------

    if not email:
        errores.setdefault("email", []).append(
            "El email es obligatorio."
        )
    elif len(email) > 255:
        errores.setdefault("email", []).append(
            "El email supera los 255 caracteres."
        )
    elif not PATRON_EMAIL.fullmatch(email):
        errores.setdefault("email", []).append(
            "Introduce una dirección de correo electrónico válida."
        )

    # ---------------------------------------------------------
    # CONTRASEÑA
    # ---------------------------------------------------------

    if not password:
        errores.setdefault("password", []).append(
            "La contraseña es obligatoria."
        )

    if len(password) < 8:
        errores.setdefault("password", []).append(
            "La contraseña debe tener al menos 8 caracteres."
        )

    if len(password) > 72:
        errores.setdefault("password", []).append(
            "La contraseña debe tener menos de 72 caracteres."
        )

    if not any(c.isupper() for c in password):
        errores.setdefault("password", []).append(
            "Debe contener al menos una mayúscula."
        )

    if not any(c.islower() for c in password):
        errores.setdefault("password", []).append(
            "Debe contener al menos una minúscula."
        )

    if not any(c.isdigit() for c in password):
        errores.setdefault("password", []).append(
            "Debe contener al menos un dígito."
        )

    if password_minus in CONTRASENAS_COMUNES:
        errores.setdefault("password", []).append(
            "Esta contraseña es demasiado común."
        )

    if es_secuencia_obvia:
        errores.setdefault("password", []).append(
            "La contraseña contiene secuencias numéricas obvias."
        )

    if re.search(r"(.)\1{3,}", password):
        errores.setdefault("password", []).append(
            "La contraseña contiene demasiados caracteres repetidos."
        )

    if email and password_minus == email:
        errores.setdefault("password", []).append(
            "La contraseña no puede ser igual al correo electrónico."
        )

    # ---------------------------------------------------------
    # TÉRMINOS Y CONFIRMACIÓN DE EDAD
    # ---------------------------------------------------------

    if terms is not True:
        errores.setdefault("terms", []).append(
            "Debes aceptar los términos y condiciones."
        )

    if years is not True:
        errores.setdefault("years", []).append(
            "Debes confirmar que cumples la edad mínima requerida."
        )

    datos = {
        "name": name,
        "email": email,
        "password": password,
        "terms": terms,
        "years": years,
    }

    return datos, errores


def validar_codigo(email, code):
    """Valida los datos necesarios para verificar el correo."""

    errores = {}

    email = email.strip().lower() if isinstance(email, str) else ""
    code = code.strip() if isinstance(code, str) else ""

    if not email:
        errores.setdefault("email", []).append(
            "El email es obligatorio."
        )
    elif len(email) > 255 or not PATRON_EMAIL.fullmatch(email):
        errores.setdefault("email", []).append(
            "El email no tiene un formato válido."
        )

    if not code:
        errores.setdefault("code", []).append(
            "El código es obligatorio."
        )
    elif not PATRON_CODIGO.fullmatch(code):
        errores.setdefault("code", []).append(
            "El código debe tener 6 caracteres válidos."
        )

    return {
        "email": email,
        "code": code,
    }, errores
