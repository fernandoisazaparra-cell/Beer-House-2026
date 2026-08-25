import pytest

from features.users.domain.entities import User, DomainValidationError

# ==========================================================
# CASOS INVÁLIDOS -> deben lanzar DomainValidationError
# ==========================================================
def test_name_is_required():
    # Verifica que el nombre no pueda estar vacío
    with pytest.raises(DomainValidationError):
        User("", "test@gmail.com", "123456", True, True)

def test_name_is_none():
    # Verifica que el nombre no pueda ser None
    with pytest.raises(DomainValidationError):
        User(None, "test@gmail.com", "123456", True, True)

def test_name_only_spaces_is_invalid():
    # Verifica que un nombre compuesto solo por espacios no sea válido
    with pytest.raises(DomainValidationError):
        User("     ", "test@gmail.com", "123456", True, True)

def test_name_with_tabs_or_newlines_is_invalid():
    # Verifica que tabs o saltos de línea dentro del nombre no sean válidos
    with pytest.raises(DomainValidationError):
        User("Juan\tPérez", "test@gmail.com", "123456", True, True)

def test_name_minimum_length():
    # Verifica que un nombre más corto que el mínimo permitido falle
    with pytest.raises(DomainValidationError):
        User("ws", "test@gmail.com", "123456", True, True)

def test_name_101_characters_fails():
    # Verifica que un nombre que excede el máximo permitido (100) falle
    with pytest.raises(DomainValidationError):
        User("A" * 101, "test@gmail.com", "123456", True, True)

def test_name_single_letter_words():
    # Verifica que palabras sueltas de una sola letra no sean válidas
    with pytest.raises(DomainValidationError):
        User("p k s j", "test@gmail.com", "123456", True, True)

def test_name_only_letters_and_spaces():
    # Verifica que el nombre no acepte números
    with pytest.raises(DomainValidationError):
        User("Juan123", "test@gmail.com", "123456", True, True)

def test_name_special_characters():
    # Verifica que el nombre no acepte símbolos/caracteres especiales
    with pytest.raises(DomainValidationError):
        User("Juan@pérez", "test@gmail.com", "123456", True, True)

def test_name_with_emoji_is_invalid():
    # Verifica que el nombre no acepte emojis
    with pytest.raises(DomainValidationError):
        User("Juan😀Pérez", "test@gmail.com", "123456", True, True)

def test_name_with_numbers_mixed_is_invalid():
    # Verifica que el nombre no acepte números aunque estén separados
    with pytest.raises(DomainValidationError):
        User("Juan Pérez 2", "test@gmail.com", "123456", True, True)

def test_name_starting_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda comenzar con guión
    with pytest.raises(DomainValidationError):
        User("-Juan", "test@gmail.com", "123456", True, True)

def test_name_ending_with_hyphen_is_invalid():
    # Verifica que el nombre no pueda terminar con guión
    with pytest.raises(DomainValidationError):
        User("Juan-", "test@gmail.com", "123456", True, True)

def test_name_with_consecutive_hyphens_is_invalid():
    # Verifica que no se permitan guiones consecutivos
    with pytest.raises(DomainValidationError):
        User("Jean--Pierre", "test@gmail.com", "123456", True, True)

def test_name_starting_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda comenzar con apóstrofe
    with pytest.raises(DomainValidationError):
        User("'Ana", "test@gmail.com", "123456", True, True)

def test_name_ending_with_apostrophe_is_invalid():
    # Verifica que el nombre no pueda terminar con apóstrofe
    with pytest.raises(DomainValidationError):
        User("Ana'", "test@gmail.com", "123456", True, True)

def test_name_with_consecutive_apostrophes_is_invalid():
    # Verifica que no se permitan apóstrofes consecutivos
    with pytest.raises(DomainValidationError):
        User("O''Brien", "test@gmail.com", "123456", True, True)

def test_name_only_hyphen_is_invalid():
    # Verifica que un nombre compuesto únicamente por un guión no sea válido
    with pytest.raises(DomainValidationError):
        User("-", "test@gmail.com", "123456", True, True)

def test_name_only_apostrophe_is_invalid():
    # Verifica que un nombre compuesto únicamente por un apóstrofe no sea válido
    with pytest.raises(DomainValidationError):
        User("'", "test@gmail.com", "123456", True, True)

# ==========================================================
# CASOS VÁLIDOS -> deben crear el usuario correctamente
# ==========================================================
def test_valid_name():
    # Verifica que un nombre y apellido simples sean válidos
    user = User("Juan Pérez", "test@gmail.com", "123456", True, True)
    assert user.name == "Juan Pérez"

def test_name_accepts_accents():
    # Verifica que se acepten tildes
    user = User("Ángel García", "test@gmail.com", "123456", True, True)
    assert user.name == "Ángel García"

def test_name_accepts_ñ():
    # Verifica que se acepte la letra ñ
    user = User("José Muñoz", "test@gmail.com", "123456", True, True)
    assert user.name == "José Muñoz"

def test_name_normalizes_capitalization_and_spaces():
    # Verifica que se recorten espacios extremos y se normalice la capitalización
    user = User("   JoSé      MuÑOz   ", "test@gmail.com", "123456", True, True)
    assert user.name == "José Muñoz"

def test_name_with_multiple_internal_spaces_normalizes():
    # Verifica que espacios múltiples internos se colapsen en uno solo
    user = User("Juan     Pérez", "test@gmail.com", "123456", True, True)
    assert user.name == "Juan Pérez"

def test_name_exactly_minimum_length():
    # Verifica que un nombre justo en el límite mínimo sea válido
    user = User("Ana", "test@gmail.com", "123456", True, True)
    assert user.name == "Ana"

def test_name_exactly_maximum_length():
    # Verifica que un nombre justo en el límite máximo (100) sea válido
    user = User("A" * 100, "test@gmail.com", "123456", True, True)
    assert len(user.name) == 100

def test_name_with_hyphen_should_be_valid():
    # Verifica que nombres compuestos con guión sean válidos (ej: Jean-Pierre)
    user = User("Jean-Pierre", "test@gmail.com", "123456", True, True)
    assert user.name == "Jean-Pierre"

def test_name_with_apostrophe_should_be_valid():
    # Verifica que nombres con apóstrofe sean válidos (ej: O'Brien, D'Angelo)
    user = User("D'Angelo", "test@gmail.com", "123456", True, True)
    assert user.name == "D'Angelo"

def test_name_with_multiple_words():
    # Verifica que nombres compuestos por varias palabras sean válidos
    user = User("María José López García", "test@gmail.com", "123456", True, True)
    assert user.name == "María José López García"

# =========================
# EMAIL
# =========================

# def test_email_is_required():
#     with pytest.raises(DomainValidationError):
#         User(
#             "Juan Pérez",
#             "",
#             "123456",
#             True,
#             True
#         )


# # =========================
# # PASSWORD
# # =========================

# def test_password_is_required():
#     with pytest.raises(DomainValidationError):
#         User(
#             "Juan Pérez",
#             "test@gmail.com",
#             "",
#             True,
#             True
#         )


# def test_password_minimum_length():
#     with pytest.raises(DomainValidationError):
#         User(
#             "Juan Pérez",
#             "test@gmail.com",
#             "12345",
#             True,
#             True
#         )


# # =========================
# # TERMS
# # =========================

# def test_terms_are_required():
#     with pytest.raises(DomainValidationError):
#         User(
#             "Juan Pérez",
#             "test@gmail.com",
#             "123456",
#             False,
#             True
#         )


# # =========================
# # YEARS / AGE
# # =========================

# def test_must_be_of_legal_age():
#     with pytest.raises(DomainValidationError):
#         User(
#             "Juan Pérez",
#             "test@gmail.com",
#             "123456",
#             True,
#             False
#         )


# # =========================
# # VALID USER
# # =========================

# def test_valid_user():
#     user = User(
#         "Juan Pérez",
#         "test@gmail.com",
#         "123456",
#         True,
#         True
#     )

#     assert user.name == "Juan Pérez"
#     assert user.email == "test@gmail.com"
#     assert user.password == "123456"
#     assert user.terms is True
#     assert user.years is True