from features.users.infrastructure.repository import (
    SQLAlchemyUserRepository
)

def cleanup_pending_registrations():
    repository = SQLAlchemyUserRepository()
    deleted = (repository.delete_expired_pending_registrations())
    print(f"Registros pendientes eliminados: {deleted}")