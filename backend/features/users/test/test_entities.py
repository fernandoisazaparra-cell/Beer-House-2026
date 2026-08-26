import pytest

from features.users.domain.entities import User, DomainValidationError

# # =========================
# # NAME
# # =========================
def test_name_is_required():
    # Verifica que el nombre no pueda estar vacío
    with pytest.raises(DomainValidationError):
        User("", "test@gmail.com", "Enana09!", True, True)

def test_name_is_none():
    # Verifica que el nombre no pueda ser None
    with pytest.raises(DomainValidationError):
        User(None, "test@gmail.com", "Enana09!", True, True)

def test_name_only_spaces_is_invalid():
    # Verifica que un nombre compuesto solo por espacios no sea válido
    with pytest.raises(DomainValidationError):
        User("     ", "test@gmail.com", "Enana09!", True, True)

def test_name_with_tabs_or_newlines_is_invalid():
    # Verifica que tabs o saltos de línea dentro del nombre no sean válidos
    with pytest.raises(DomainValidationError):
        User("Juan\tPérez", "test@gmail.com", "Enana09!", True, True)

def test_name_minimum_length():
    # Verifica que un nombre más corto que el mínimo permitido falle
    with pytest.raises(DomainValidationError):
        User("ws", "test@gmail.com", "Enana09!", True, True)

def test_name_101_characters_fails():
    # Verifica que un nombre que excede el máximo permitido (100) falle
    with pytest.raises(DomainValidationError):
        User("A" * 101, "test@gmail.com", "Enana09!", True, True)

def test_name_single_letter_words():
    # Verifica que palabras sueltas de una sola letra no sean válidas
    with pytest.raises(DomainValidationError):
        User("p k s j", "test@gmail.com", "Enana09!", True, True)

def test_name_only_letters_and_spaces():
    # Verifica que el nombre no acepte números
    with pytest.raises(DomainValidationError):
        User("Juan123", "test@gmail.com", "Enana09!", True, True)

def test_name_special_characters():
    # Verifica que el nombre no acepte símbolos/caracteres especiales
    with pytest.raises(DomainValidationError):
        User("Juan@pérez", "test@gmail.com", "Enana09!", True, True)

def test_name_with_emoji_is_invalid():
    # Verifica que el nombre no acepte emojis
    with pytest.raises(DomainValidationError):
        User("Juan😀Pérez", "test@gmail.com", "Enana09!", True, True)

def test_name_with_numbers_mixed_is_invalid():
    # Verifica que el nombre no acepte números aunque estén separados
    with pytest.raises(DomainValidationError):
        User("Juan Pérez 2", "test@gmail.com", "Enana09!", True, True)

def test_name_starting_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda comenzar con guión
    with pytest.raises(DomainValidationError):
        User("-Juan", "test@gmail.com", "Enana09!", True, True)

def test_name_ending_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda terminar con guión
    with pytest.raises(DomainValidationError):
        User("Juan-", "test@gmail.com", "Enana09!", True, True)

def test_name_with_consecutive_hyphens_is_invalid():
    # Verifica que no se permitan guiones consecutivos
    with pytest.raises(DomainValidationError):
        User("Jean--Pierre", "test@gmail.com", "Enana09!", True, True)

def test_name_starting_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda comenzar con apóstrofe
    with pytest.raises(DomainValidationError):
        User("'Ana", "test@gmail.com", "Enana09!", True, True)

def test_name_ending_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda terminar con apóstrofe
    with pytest.raises(DomainValidationError):
        User("Ana'", "test@gmail.com", "Enana09!", True, True)

def test_name_with_consecutive_apostrophes_is_invalid():
    # Verifica que no se permitan apóstrofes consecutivos
    with pytest.raises(DomainValidationError):
        User("O''Brien", "test@gmail.com", "Enana09!", True, True)

def test_name_only_hyphen_is_invalid():
    # Verifica que un nombre compuesto únicamente por un guión no sea válido
    with pytest.raises(DomainValidationError):
        User("-", "test@gmail.com", "Enana09!", True, True)

def test_name_only_apostrophe_is_invalid():
    # Verifica que un nombre compuesto únicamente por un apóstrofe no sea válido
    with pytest.raises(DomainValidationError):
        User("'", "test@gmail.com", "Enana09!", True, True)

def test_valid_name():
    # Verifica que un nombre y apellido simples sean válidos
    user = User("Juan Pérez", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "Juan Pérez"

def test_name_accepts_accents():
    # Verifica que se acepten tildes
    user = User("Ángel García", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "Ángel García"

def test_name_accepts_ñ():
    # Verifica que se acepte la letra ñ
    user = User("José Muñoz", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "José Muñoz"

def test_name_normalizes_capitalization_and_spaces():
    # Verifica que se recorten espacios extremos y se normalice la capitalización
    user = User("   JoSé      MuÑOz   ", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "José Muñoz"

def test_name_with_multiple_internal_spaces_normalizes():
    # Verifica que espacios múltiples internos se colapsen en uno solo
    user = User("Juan     Pérez", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "Juan Pérez"

def test_name_exactly_minimum_length():
    # Verifica que un nombre justo en el límite mínimo sea válido
    user = User("Ana", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "Ana"

def test_name_exactly_maximum_length():
    # Verifica que un nombre justo en el límite máximo (100) sea válido
    user = User("A" * 100, "test@gmail.com", "Enana09!", True, True)
    assert len(user.name) == 100

def test_name_with_hyphen_should_be_valid():
    # Verifica que nombres compuestos con guión sean válidos (ej: Jean-Pierre)
    user = User("Jean-Pierre", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "Jean-Pierre"

def test_name_with_apostrophe_should_be_valid():
    # Verifica que nombres con apóstrofe sean válidos (ej: O'Brien, D'Angelo)
    user = User("D'Angelo", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "D'Angelo"

def test_name_with_multiple_words():
    # Verifica que nombres compuestos por varias palabras sean válidos
    user = User("María José López García", "test@gmail.com", "Enana09!", True, True)
    assert user.name == "María José López García"

# =========================
# EMAIL
# =========================
def test_email_is_required():
    # Verifica que el email no pueda estar vacío
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "", "Segura2026", True, True)
 
def test_email_is_none():
    # Verifica que el email no pueda ser None
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", None, "Segura2026", True, True)
 
def test_email_only_spaces_is_invalid():
    # Verifica que un email compuesto solo por espacios no sea válido
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "     ", "Segura2026", True, True)
 
def test_email_maximum_length():
    # Verifica que un email que excede el máximo (255) falle
    long_local_part = "a" * 250
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", f"{long_local_part}@gmail.com", "Segura2026", True, True)

def test_valid_email():
    # Verifica que un email normal, ya en minúsculas, sea válido
    user = User("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert user.email == "test@gmail.com"
 
def test_email_normalizes_to_lowercase():
    # Verifica que un email con mayúsculas se normalice a minúsculas.
    # OJO: el assert compara contra la versión YA normalizada,
    # no contra el valor original que se pasó al constructor.
    user = User("Juan Pérez", "Test@Gmail.com", "Segura2026", True, True)
    assert user.email == "test@gmail.com"
 
def test_email_fully_uppercase_normalizes_to_lowercase():
    # Verifica que un email completamente en mayúsculas también se normalice
    user = User("Juan Pérez", "TEST@GMAIL.COM", "Segura2026", True, True)
    assert user.email == "test@gmail.com"
 
def test_email_trims_leading_and_trailing_spaces():
    # Verifica que se recorten espacios al inicio y al final
    user = User("Juan Pérez", "   test@gmail.com   ", "Segura2026", True, True)
    assert user.email == "test@gmail.com"
 
def test_email_trims_and_lowercases_together():
    # Verifica que trim y normalización a minúsculas funcionen combinados,
    # sin que una regla interfiera con la otra
    user = User("Juan Pérez", "   Test@Gmail.com   ", "Segura2026", True, True)
    assert user.email == "test@gmail.com"
 
def test_email_exactly_maximum_length():
    # Verifica que un email justo en el límite máximo (255) sea válido.
    # Se arma la parte local para que el total sea exactamente 255,
    # y se compara en minúsculas porque ya pasó por la normalización.
    local_part = "a" * 245  # 243 + "@gmail.com" (12) = 255
    email = f"{local_part}@gmail.com"
    user = User("Juan Pérez", email, "Segura2026", True, True)
    assert len(user.email) == 255
    assert user.email == email.lower()
 
def test_email_with_plus_alias_is_preserved():
    # Verifica que un alias con "+" (ej: Gmail) no se elimine,
    # solo se normaliza a minúsculas junto con el resto
    user = User("Juan Pérez", "Test+Promo@Gmail.com", "Segura2026", True, True)
    assert user.email == "test+promo@gmail.com"
 
def test_email_with_dots_in_local_part_is_preserved():
    # Verifica que los puntos en la parte local no se eliminen,
    # solo se normaliza la capitalización
    user = User("Juan Pérez", "Test.User@Gmail.com", "Segura2026", True, True)
    assert user.email == "test.user@gmail.com"
 

# # =========================
# # PASSWORD
# # =========================
def test_password_is_required():
    # Verifica que la contraseña no pueda estar vacía
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "", True, True)

def test_password_is_none():
    # Verifica que la contraseña no pueda ser None
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", None, True, True)

def test_password_only_spaces_is_invalid():
    # Verifica que una contraseña compuesta solo por espacios no sea válida
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "        ", True, True)

def test_password_minimum_length():
    # Verifica que una contraseña más corta que el mínimo (8) falle
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Abc123", True, True)

def test_password_maximum_length():
    # Verifica que una contraseña más larga que el máximo (72) falle
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "A1" + "a" * 71, True, True)

def test_password_without_uppercase_is_invalid():
    # Verifica que se exija al menos una mayúscula
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "abcdefg1", True, True)

def test_password_without_lowercase_is_invalid():
    # Verifica que se exija al menos una minúscula
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "ABCDEFG1", True, True)

def test_password_without_number_is_invalid():
    # Verifica que se exija al menos un número
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Abcdefgh", True, True)

def test_password_with_leading_space_is_invalid():
    # Verifica que no se permitan espacios al inicio
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", " Abcdefg1", True, True)

def test_password_with_trailing_space_is_invalid():
    # Verifica que no se permitan espacios al final
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Abcdefg1 ", True, True)

def test_password_with_internal_space_is_invalid():
    # Verifica que no se permitan espacios internos
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Abcde fg1", True, True)

def test_password_equal_to_email_is_invalid():
    # Verifica que la contraseña no pueda ser igual al email
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "test@gmail.com", True, True)

def test_password_equal_to_email_case_insensitive_is_invalid():
    # Verifica que la comparación con el email no distinga mayúsculas/minúsculas
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "TEST@GMAIL.COM", True, True)

def test_password_equal_to_name_is_invalid():
    # Verifica que la contraseña no pueda ser igual al nombre
    with pytest.raises(DomainValidationError):
        User("Juanperez1", "test@gmail.com", "Juanperez1", True, True)

def test_password_equal_to_name_case_insensitive_is_invalid():
    # Verifica que la comparación con el nombre no distinga mayúsculas/minúsculas
    with pytest.raises(DomainValidationError):
        User("Juanperez1", "test@gmail.com", "juanperez1", True, True)

def test_password_common_password_is_invalid():
    # Verifica que se rechacen contraseñas extremadamente comunes
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Password1", True, True)

def test_password_sequential_numbers_is_invalid():
    # Verifica que se rechacen secuencias numéricas obvias
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Abcd1234", True, True)

def test_password_same_repeated_character_is_invalid():
    # Verifica que se rechace una contraseña con el mismo carácter repetido
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Aaaaaaa1", True, True)

def test_valid_password():
    # Verifica que una contraseña que cumple todas las reglas sea válida
    user = User("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert user.password is not None

def test_password_exactly_minimum_length():
    # Verifica que una contraseña justo en el límite mínimo (8) sea válida
    user = User("Juan Pérez", "test@gmail.com", "Abcdefg1", True, True)
    assert len(user.password) == 8

def test_password_exactly_maximum_length():
    # Verifica que una contraseña justo en el límite máximo (72) sea válida,
    password = "Ab1" + "aB2" * 23
    user = User("Juan Pérez", "test@gmail.com", password, True, True)
    assert len(user.password) == 72

def test_password_with_special_characters_is_valid():
    # Verifica que se acepten símbolos especiales en la contraseña
    user = User("Juan Pérez", "test@gmail.com", "Segura2026!", True, True)
    assert user.password == "Segura2026!"

def test_password_with_accents_is_valid():
    # Verifica que se acepten tildes/ñ dentro de la contraseña
    user = User("Juan Pérez", "test@gmail.com", "Contraseña1", True, True)
    assert user.password == "Contraseña1"

def test_password_similar_but_not_equal_to_name_is_valid():
    # Verifica que una contraseña parecida (pero no igual) al nombre sea válida
    user = User("Juan Pérez", "test@gmail.com", "JuanPerez99", True, True)
    assert user.password == "JuanPerez99"

def test_password_similar_but_not_equal_to_email_is_valid():
    # Verifica que una contraseña parecida (pero no igual) al email sea válida
    user = User("Juan Pérez", "test@gmail.com", "Test@gmail99", True, True)
    assert user.password == "Test@gmail99"

# # =========================
# # TERMS
# # =========================
def test_terms_false_is_invalid():
    # Verifica que no aceptar los términos impida el registro
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Segura2026", False, True)

def test_terms_none_is_invalid():
    # Verifica que None (ausencia de valor) se trate como no aceptado
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Segura2026", None, True)

def test_years_false_is_invalid():
    # Verifica que no confirmar mayoría de edad impida el registro
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Segura2026", True, False)

def test_years_none_is_invalid():
    # Verifica que None se trate como no confirmado
    with pytest.raises(DomainValidationError):
        User("Juan Pérez", "test@gmail.com", "Segura2026", True, None)

def test_both_terms_and_years_false_reports_both_errors():
    # Verifica que si ambos fallan, el error incluya las dos claves,
    # no solo una (importante para mostrar los dos mensajes en el frontend)
    with pytest.raises(DomainValidationError) as exc_info:
        User("Juan Pérez", "test@gmail.com", "Segura2026", False, False)
    assert 'terms' in exc_info.value.errors
    assert 'years' in exc_info.value.errors

def test_terms_and_years_true_is_valid():
    # Verifica que aceptar ambos permita crear el usuario
    user = User("Juan Pérez", "test@gmail.com", "Segura2026", True, True)
    assert user.terms is True
    assert user.years is True