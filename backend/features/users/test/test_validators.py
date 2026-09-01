# =====================================================================
# Tests de las reglas de validación de usuarios
# ---------------------------------------------------------------------
# Cada test llama a validar_usuario() y revisa:
#   - caso inválido:  que "errores" contenga el campo esperado.
#   - caso válido:    que "errores" esté vacío y que los datos quedaron
#                     normalizados como se espera.
# Para correrlo:  pytest
# =====================================================================
from features.users.domain.validators import (
    validar_codigo,
    validar_usuario,
)


# =========================
# NAME
# =========================
def test_name_is_required():
    # Verifica que el nombre no pueda estar vacío
    _, errores = validar_usuario("", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_is_none():
    # Verifica que el nombre no pueda ser None
    _, errores = validar_usuario(None, "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_only_spaces_is_invalid():
    # Verifica que un nombre compuesto solo por espacios no sea válido
    _, errores = validar_usuario("     ", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_with_tabs_or_newlines_is_invalid():
    # Verifica que tabs o saltos de línea dentro del nombre no sean válidos
    _, errores = validar_usuario("Juan\tPérez", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_minimum_length():
    # Verifica que un nombre más corto que el mínimo permitido falle
    _, errores = validar_usuario("ws", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_101_characters_fails():
    # Verifica que un nombre que excede el máximo permitido (100) falle
    _, errores = validar_usuario("A" * 101, "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_single_letter_words():
    # Verifica que palabras sueltas de una sola letra no sean válidas
    _, errores = validar_usuario("p k s j", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_only_letters_and_spaces():
    # Verifica que el nombre no acepte números
    _, errores = validar_usuario("Juan123", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_special_characters():
    # Verifica que el nombre no acepte símbolos/caracteres especiales
    _, errores = validar_usuario("Juan@pérez", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_with_emoji_is_invalid():
    # Verifica que el nombre no acepte emojis
    _, errores = validar_usuario("Juan😀Pérez", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_with_numbers_mixed_is_invalid():
    # Verifica que el nombre no acepte números aunque estén separados
    _, errores = validar_usuario("Juan Pérez 2", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_starting_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda comenzar con guión
    _, errores = validar_usuario("-Juan", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_ending_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda terminar con guión
    _, errores = validar_usuario("Juan-", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_with_consecutive_hyphens_is_invalid():
    # Verifica que no se permitan guiones consecutivos
    _, errores = validar_usuario("Jean--Pierre", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_starting_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda comenzar con apóstrofe
    _, errores = validar_usuario("'Ana", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_ending_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda terminar con apóstrofe
    _, errores = validar_usuario("Ana'", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_with_consecutive_apostrophes_is_invalid():
    # Verifica que no se permitan apóstrofes consecutivos
    _, errores = validar_usuario("O''Brien", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_only_hyphen_is_invalid():
    # Verifica que un nombre compuesto únicamente por un guión no sea válido
    _, errores = validar_usuario("-", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_name_only_apostrophe_is_invalid():
    # Verifica que un nombre compuesto únicamente por un apóstrofe no sea válido
    _, errores = validar_usuario("'", "test@gmail.com", "Enana09!", True, True)
    assert "name" in errores

def test_valid_name():
    # Verifica que un nombre y apellido simples sean válidos
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "Juan Pérez"

def test_name_accepts_accents():
    # Verifica que se acepten tildes
    datos, errores = validar_usuario("Ángel García", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "Ángel García"

def test_name_accepts_ñ():
    # Verifica que se acepte la letra ñ
    datos, errores = validar_usuario("José Muñoz", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "José Muñoz"

def test_name_normalizes_capitalization_and_spaces():
    # Verifica que se recorten espacios extremos y se normalice la capitalización
    datos, errores = validar_usuario("   JoSé      MuÑOz   ", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "José Muñoz"

def test_name_with_multiple_internal_spaces_normalizes():
    # Verifica que espacios múltiples internos se colapsen en uno solo
    datos, errores = validar_usuario("Juan     Pérez", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "Juan Pérez"

def test_name_exactly_minimum_length():
    # Verifica que un nombre justo en el límite mínimo sea válido
    datos, errores = validar_usuario("Ana", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "Ana"

def test_name_exactly_maximum_length():
    # Verifica que un nombre justo en el límite máximo (100) sea válido
    datos, errores = validar_usuario("A" * 100, "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert len(datos["name"]) == 100

def test_name_with_hyphen_should_be_valid():
    # Verifica que nombres compuestos con guión sean válidos (ej: Jean-Pierre)
    datos, errores = validar_usuario("Jean-Pierre", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "Jean-Pierre"

def test_name_with_apostrophe_should_be_valid():
    # Verifica que nombres con apóstrofe sean válidos (ej: O'Brien, D'Angelo)
    datos, errores = validar_usuario("D'Angelo", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "D'Angelo"

def test_name_with_multiple_words():
    # Verifica que nombres compuestos por varias palabras sean válidos
    datos, errores = validar_usuario("María José López García", "test@gmail.com", "Enana09!", True, True)
    assert not errores
    assert datos["name"] == "María José López García"

# =========================
# EMAIL
# =========================
def test_email_is_required():
    # Verifica que el email no pueda estar vacío
    _, errores = validar_usuario("Juan Pérez", "", "Segura2026", True, True)
    assert "email" in errores

def test_email_is_none():
    # Verifica que el email no pueda ser None
    _, errores = validar_usuario("Juan Pérez", None, "Segura2026", True, True)
    assert "email" in errores

def test_email_only_spaces_is_invalid():
    # Verifica que un email compuesto solo por espacios no sea válido
    _, errores = validar_usuario("Juan Pérez", "     ", "Segura2026", True, True)
    assert "email" in errores

def test_email_maximum_length():
    # Verifica que un email que excede el máximo (255) falle
    long_local_part = "a" * 250
    _, errores = validar_usuario("Juan Pérez", f"{long_local_part}@gmail.com", "Segura2026", True, True)
    assert "email" in errores

def test_valid_email():
    # Verifica que un email normal, ya en minúsculas, sea válido
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test@gmail.com"

def test_email_normalizes_to_lowercase():
    # Verifica que un email con mayúsculas se normalice a minúsculas
    datos, errores = validar_usuario("Juan Pérez", "Test@Gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test@gmail.com"

def test_email_fully_uppercase_normalizes_to_lowercase():
    # Verifica que un email completamente en mayúsculas también se normalice
    datos, errores = validar_usuario("Juan Pérez", "TEST@GMAIL.COM", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test@gmail.com"

def test_email_trims_leading_and_trailing_spaces():
    # Verifica que se recorten espacios al inicio y al final
    datos, errores = validar_usuario("Juan Pérez", "   test@gmail.com   ", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test@gmail.com"

def test_email_trims_and_lowercases_together():
    # Verifica que trim y normalización a minúsculas funcionen combinados
    datos, errores = validar_usuario("Juan Pérez", "   Test@Gmail.com   ", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test@gmail.com"

def test_email_exactly_maximum_length():
    # Verifica que un email justo en el límite máximo (255) sea válido
    local_part = "a" * 245  # 243 + "@gmail.com" (12) = 255
    email = f"{local_part}@gmail.com"
    datos, errores = validar_usuario("Juan Pérez", email, "Segura2026", True, True)
    assert not errores
    assert len(datos["email"]) == 255
    assert datos["email"] == email.lower()

def test_email_with_plus_alias_is_preserved():
    # Verifica que un alias con "+" (ej: Gmail) no se elimine
    datos, errores = validar_usuario("Juan Pérez", "Test+Promo@Gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test+promo@gmail.com"

def test_email_with_dots_in_local_part_is_preserved():
    # Verifica que los puntos en la parte local no se eliminen
    datos, errores = validar_usuario("Juan Pérez", "Test.User@Gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["email"] == "test.user@gmail.com"

# =========================
# PASSWORD
# =========================
def test_password_is_required():
    # Verifica que la contraseña no pueda estar vacía
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "", True, True)
    assert "password" in errores

def test_password_is_none():
    # Verifica que la contraseña no pueda ser None
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", None, True, True)
    assert "password" in errores

def test_password_only_spaces_is_invalid():
    # Verifica que una contraseña compuesta solo por espacios no sea válida
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "        ", True, True)
    assert "password" in errores

def test_password_minimum_length():
    # Verifica que una contraseña más corta que el mínimo (8) falle
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abc123", True, True)
    assert "password" in errores

def test_password_maximum_length():
    # Verifica que una contraseña más larga que el máximo (72) falle
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "A1" + "a" * 71, True, True)
    assert "password" in errores

def test_password_without_uppercase_is_invalid():
    # Verifica que se exija al menos una mayúscula
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "abcdefg1", True, True)
    assert "password" in errores

def test_password_without_lowercase_is_invalid():
    # Verifica que se exija al menos una minúscula
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "ABCDEFG1", True, True)
    assert "password" in errores

def test_password_without_number_is_invalid():
    # Verifica que se exija al menos un número
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abcdefgh", True, True)
    assert "password" in errores

def test_password_with_leading_space_is_invalid():
    # Verifica que no se permitan espacios al inicio
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", " Abcdefg1", True, True)
    assert "password" in errores

def test_password_with_trailing_space_is_invalid():
    # Verifica que no se permitan espacios al final
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abcdefg1 ", True, True)
    assert "password" in errores

def test_password_with_internal_space_is_invalid():
    # Verifica que no se permitan espacios internos
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abcde fg1", True, True)
    assert "password" in errores

def test_password_equal_to_email_is_invalid():
    # Verifica que la contraseña no pueda ser igual al email
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "test@gmail.com", True, True)
    assert "password" in errores

def test_password_equal_to_email_case_insensitive_is_invalid():
    # Verifica que la comparación con el email no distinga mayúsculas/minúsculas
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "TEST@GMAIL.COM", True, True)
    assert "password" in errores

def test_password_equal_to_name_is_invalid():
    # Verifica que la contraseña no pueda ser igual al nombre (no se permite el registro)
    _, errores = validar_usuario("Juanperez1", "test@gmail.com", "Juanperez1", True, True)
    assert errores

def test_password_equal_to_name_case_insensitive_is_invalid():
    # Verifica que la comparación con el nombre no distinga mayúsculas/minúsculas
    _, errores = validar_usuario("Juanperez1", "test@gmail.com", "juanperez1", True, True)
    assert errores

def test_password_common_password_is_invalid():
    # Verifica que se rechacen contraseñas extremadamente comunes
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Password1", True, True)
    assert "password" in errores

def test_password_sequential_numbers_is_invalid():
    # Verifica que se rechacen secuencias numéricas obvias
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abcd1234", True, True)
    assert "password" in errores

def test_password_same_repeated_character_is_invalid():
    # Verifica que se rechace una contraseña con el mismo carácter repetido
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Aaaaaaa1", True, True)
    assert "password" in errores

def test_valid_password():
    # Verifica que una contraseña que cumple todas las reglas sea válida
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["password"] is not None

def test_password_exactly_minimum_length():
    # Verifica que una contraseña justo en el límite mínimo (8) sea válida
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Abcdefg1", True, True)
    assert not errores
    assert len(datos["password"]) == 8

def test_password_exactly_maximum_length():
    # Verifica que una contraseña justo en el límite máximo (72) sea válida
    password = "Ab1" + "aB2" * 23
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", password, True, True)
    assert not errores
    assert len(datos["password"]) == 72

def test_password_with_special_characters_is_valid():
    # Verifica que se acepten símbolos especiales en la contraseña
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026!", True, True)
    assert not errores
    assert datos["password"] == "Segura2026!"

def test_password_with_accents_is_valid():
    # Verifica que se acepten tildes/ñ dentro de la contraseña
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Contraseña1", True, True)
    assert not errores
    assert datos["password"] == "Contraseña1"

def test_password_similar_but_not_equal_to_name_is_valid():
    # Verifica que una contraseña parecida (pero no igual) al nombre sea válida
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "JuanPerez99", True, True)
    assert not errores
    assert datos["password"] == "JuanPerez99"

def test_password_similar_but_not_equal_to_email_is_valid():
    # Verifica que una contraseña parecida (pero no igual) al email sea válida
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Test@gmail99", True, True)
    assert not errores
    assert datos["password"] == "Test@gmail99"

# =========================
# TERMS
# =========================
def test_terms_false_is_invalid():
    # Verifica que no aceptar los términos impida el registro
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", False, True)
    assert "terms" in errores

def test_terms_none_is_invalid():
    # Verifica que None (ausencia de valor) se trate como no aceptado
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", None, True)
    assert "terms" in errores

def test_years_false_is_invalid():
    # Verifica que no confirmar mayoría de edad impida el registro
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", True, False)
    assert "years" in errores

def test_years_none_is_invalid():
    # Verifica que None se trate como no confirmado
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", True, None)
    assert "years" in errores

def test_both_terms_and_years_false_reports_both_errors():
    # Verifica que si ambos fallan, el error incluya las dos claves,
    # no solo una (importante para mostrar los dos mensajes en el frontend)
    _, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", False, False)
    assert "terms" in errores
    assert "years" in errores

def test_terms_and_years_true_is_valid():
    # Verifica que aceptar ambos permita crear el usuario
    datos, errores = validar_usuario("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert not errores
    assert datos["terms"] is True
    assert datos["years"] is True

# =========================
# CÓDIGO DE VERIFICACIÓN
# =========================
def test_validar_codigo_requires_email_and_code():
    _, errores = validar_codigo("", "")
    assert "email" in errores
    assert "code" in errores

def test_validar_codigo_requires_6_characters():
    _, errores = validar_codigo("test@gmail.com", "12345")
    assert "code" in errores

def test_validar_codigo_valid():
    datos, errores = validar_codigo("Test@Gmail.com", "  ABC123 ")
    assert not errores
    assert datos["email"] == "test@gmail.com"
    assert datos["code"] == "ABC123"
