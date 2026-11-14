# Roles del sistema (una sola fuente de verdad)
ADMIN = "admin"
SUPERVISOR = "supervisor"
USER = "user"

# Roles que pueden entrar a la parte administrativa
STAFF_ROLES = (ADMIN, SUPERVISOR)

# Nombre en español, que es el que usan los servicios de inventario
ROLE_LABELS = {
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    USER: "Cliente",
}