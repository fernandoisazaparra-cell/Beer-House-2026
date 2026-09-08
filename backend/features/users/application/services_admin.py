# =====================================================================
# Servicios de administración de usuarios + estadísticas del dashboard
# ---------------------------------------------------------------------
# El admin necesita ver todos los usuarios, cambiarles el rol y
# eliminarlos. Toda esta lógica vive aquí (no en la capa HTTP).
# =====================================================================
from ..infrastructure.repository import SQLAlchemyUserRepository

ROLES_PERMITIDOS = {"user", "admin"}


def serializar_usuario(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "rol": user.rol,
        "google": bool(user.google_id),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


class AdminUserService:
    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def get_users(self):
        return [serializar_usuario(u) for u in self.repository.get_all()]

    def update_rol(self, user_id, rol):
        if rol not in ROLES_PERMITIDOS:
            raise ValueError("Rol inválido. Solo se permiten 'user' o 'admin'")
        user = self.repository.find_by_id(user_id)
        if user is None:
            raise ValueError("Usuario no encontrado")
        return serializar_usuario(self.repository.update_rol(user, rol))

    def delete_user(self, user_id):
        user = self.repository.find_by_id(user_id)
        if user is None:
            raise ValueError("Usuario no encontrado")
        self.repository.delete(user)
        return {"message": "Usuario eliminado"}

    # ---------- Estadísticas del dashboard ----------
    def stats(self):
        users = self.repository.get_all()
        clientes = sum(1 for u in users if u.rol == "user")
        admins = sum(1 for u in users if u.rol == "admin")
        return {
            "total_users": len(users),
            "clientes": clientes,
            "admins": admins,
        }
