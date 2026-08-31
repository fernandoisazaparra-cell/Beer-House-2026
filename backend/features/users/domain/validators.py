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
import re

# Contraseñas tan comunes que no se permiten (en minúsculas para comparar fácil)
CONTRASEÑAS_COMUNES = {
    "password1", "password123", "12345678", "123456789",
    "admin123", "welcome1", "contraseña", "qwerty123", "secret123",
}

# Secuencias numéricas demasiado obvias (1234, 4321, 1111...)
PATRONES_SECUENCIA = [
    r"0123|1234|2345|3456|4567|5678|6789",
    r"9876|8765|7654|6543|5432|4321|3210",
    r"(\d)\1{3,}",
]

# Un nombre solo puede contener letras, espacios, guiones y apóstrofes.
# La "ñ" y las tildes están permitidas.
PATRON_NOMBRE = re.compile(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]+")

def normalizar_nombre(nombre):
    """Convierte '   joSé   delos MUÑoz   ' en 'José Delos Muñoz'."""
    return " ".join(
        "'".join(
            "-".join(palabra.capitalize() for palabra in trozo.split("-"))
            for trozo in parte.split("'")
        )
        for parte in nombre.strip().split()
    )

def validar_usuario(name, email, password, terms, years):
    """Valida y normaliza los datos de un registro.

    Devuelve (datos, errores):
      - datos:   dict con name, email y password YA normalizados.
      - errores: dict {campo: [mensajes]}. Vacío si todo está bien.
    """
    errores = {}

    # Tratamos None como texto vacío para simplificar las validaciones
    name = name or ""
    email = email or ""
    password = password or ""

    # --- Verificaciones sobre los datos CRUDOS (antes de normalizar) ---
    if name and not PATRON_NOMBRE.fullmatch(name):
        errores.setdefault("name", []).append("El nombre solo puede contener letras y espacios")

    if password and " " in password:
        errores.setdefault("password", []).append("La contraseña no puede contener espacios")

    # --- Normalización ---
    name = normalizar_nombre(name) if name.strip() else ""
    email = "".join(email.strip().split()).lower()
    password = "".join(password.strip().split())

    letras_nombre = name.replace(" ", "")
    palabras_nombre = name.split()
    password_minus = password.lower()
    email_minus = email.lower()
    es_secuencia_obvia = any(re.search(patron, password) for patron in PATRONES_SECUENCIA)

    # --- Nombre ---
    if not name:
        errores.setdefault("name", []).append("El nombre es obligatorio")
    if any(len(palabra) < 2 for palabra in palabras_nombre):
        errores.setdefault("name", []).append("Cada nombre o apellido debe tener al menos 2 letras")
    if len(letras_nombre) < 3:
        errores.setdefault("name", []).append("El nombre es demasiado corto")
    if len(name) > 100:
        errores.setdefault("name", []).append("El nombre es demasiado largo")
    if name.startswith("-") or name.endswith("-"):
        errores.setdefault("name", []).append("El nombre no puede comenzar ni terminar con guion")
    if name.startswith("'") or name.endswith("'"):
        errores.setdefault("name", []).append("El nombre no puede comenzar ni terminar con apóstrofe")
    if "--" in name:
        errores.setdefault("name", []).append("El nombre no puede contener guiones consecutivos")
    if "''" in name:
        errores.setdefault("name", []).append("El nombre no puede contener apóstrofes consecutivos")
    if " - " in name:
        errores.setdefault("name", []).append("El guion debe estar unido a las palabras")

    # --- Email ---
    if not email:
        errores.setdefault("email", []).append("El email es obligatorio")
    if len(email) > 255:
        errores.setdefault("email", []).append("El email debe tener menos de 255 caracteres")

    # --- Contraseña ---
    if not password:
        errores.setdefault("password", []).append("La contraseña es obligatoria")
    if len(password) < 8:
        errores.setdefault("password", []).append("La contraseña debe tener al menos 8 caracteres")
    if len(password) > 72:
        errores.setdefault("password", []).append("La contraseña debe tener menos de 72 caracteres")
    if not any(caracter.isupper() for caracter in password):
        errores.setdefault("password", []).append("La contraseña debe tener al menos una mayúscula")
    if not any(caracter.islower() for caracter in password):
        errores.setdefault("password", []).append("La contraseña debe tener al menos una minúscula")
    if not any(caracter.isdigit() for caracter in password):
        errores.setdefault("password", []).append("La contraseña debe tener al menos un dígito")
    if password_minus in CONTRASEÑAS_COMUNES:
        errores.setdefault("password", []).append("Esta contraseña es demasiado común y no es segura")
    if es_secuencia_obvia:
        errores.setdefault("password", []).append("La contraseña contiene secuencias numéricas muy obvias")
    if re.search(r"(.)\1{3,}", password):
        errores.setdefault("password", []).append("La contraseña no puede contener caracteres repetidos consecutivamente")
    if password_minus == email_minus:
        errores.setdefault("password", []).append("La contraseña no puede ser igual al correo electrónico")

    # --- Términos y mayoría de edad ---
    if not terms:
        errores.setdefault("terms", []).append("Debes aceptar los términos y condiciones")

    if not years:
        errores.setdefault("years", []).append("Debes confirmar que eres mayor de edad")

    datos = {
        "name": name,
        "email": email,
        "password": password,
        "terms": terms,
        "years": years,
    }
    return datos, errores

def validar_codigo(email, code):
    """Valida los datos para verificar un código por email.
    Devuelve (datos, errores) con el email y el código normalizados.
    """
    errores = {}

    email = (email or "").strip().lower()
    code = (code or "").strip()

    if not email:
        errores.setdefault("email", []).append("El email es obligatorio")

    if not code:
        errores.setdefault("code", []).append("El código es obligatorio")
    elif len(code) != 6:
        errores.setdefault("code", []).append("El código debe tener 6 caracteres")

    return {"email": email, "code": code}, errores
