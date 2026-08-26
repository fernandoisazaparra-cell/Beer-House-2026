from features.users.infrastructure.repository import (
    SQLAlchemyUserRepository
)

def cleanup_pending_registrations():
    from app.scheduler import _flask_app
    with _flask_app.app_context():
        repository = SQLAlchemyUserRepository()
        deleted = repository.delete_expired_pending_registrations()
        print(f"Registros pendientes eliminados: {deleted}")