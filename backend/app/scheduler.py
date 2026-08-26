from app.cleanup.pending_registration_cleanup import cleanup_pending_registrations
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
_flask_app = None

def start_scheduler(app):
    global _flask_app
    _flask_app = app
    scheduler.add_job(
        cleanup_pending_registrations,
        trigger='interval',
        minutes=15,
        id='cleanup_pending_registrations',
        replace_existing=True
    )
    scheduler.start()