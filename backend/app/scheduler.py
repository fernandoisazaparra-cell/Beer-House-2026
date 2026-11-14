
# =====================================================================
# Tareas programadas (APScheduler) - Beer House
# ---------------------------------------------------------------------
# Limpia los registros de verificación expirados cada 15 minutos.
# Evita iniciar el scheduler más de una vez por proceso.
# =====================================================================

import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(
    timezone="America/Bogota"
)


def tarea_limpieza(app):
    """
    Elimina registros de verificación expirados.
    Ejecuta las consultas dentro del contexto de Flask.
    """

    try:
        from features.users.application.services import (
            limpiar_registros_expirados
        )

        with app.app_context():
            eliminados = limpiar_registros_expirados()

            logger.info(
                "Registros pendientes eliminados: %s",
                eliminados
            )

    except Exception:
        logger.exception(
            "Error durante la limpieza de registros expirados."
        )


def start_scheduler(app):

    # Evitar iniciar múltiples veces el scheduler.
    if scheduler.running:
        logger.info("El scheduler ya está funcionando.")
        return

    # Evitar duplicados del proceso de reloader de Flask.
    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        logger.info(
            "Scheduler pendiente de iniciar en el proceso principal."
        )
        return

    scheduler.add_job(
        tarea_limpieza,
        trigger="interval",
        minutes=15,
        args=[app],
        id="cleanup_pending_registrations",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()

    logger.info(
        "Scheduler iniciado. Limpieza cada 15 minutos."
    )


def stop_scheduler():
    """
    Detiene el scheduler si está funcionando.
    """

    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido.")

