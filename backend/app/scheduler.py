# =====================================================================
# Tareas programadas (APScheduler)
# ---------------------------------------------------------------------
# Cada 15 minutos se borran los registros pendientes cuyo código de
# verificación expiró. Así la tabla no se llena de intentos viejos.
# =====================================================================
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def start_scheduler(app):
    def tarea_limpieza():
        # El import va aquí para evitar imports circulares
        from features.users.application.services import limpiar_registros_expirados

        # Las consultas a la BD necesitan estar dentro del contexto de la app
        with app.app_context():
            eliminados = limpiar_registros_expirados()
            print(f"Registros pendientes eliminados: {eliminados}")

    scheduler.add_job(
        tarea_limpieza,
        trigger="interval",
        minutes=15,
        id="cleanup_pending_registrations",
        replace_existing=True,
    )
    scheduler.start()
