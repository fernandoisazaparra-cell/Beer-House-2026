from app.cleanup.pending_registration_cleanup import cleanup_pending_registrations
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def start_scheduler(app):
    scheduler.add_job(
        cleanup_pending_registrations,
        trigger='interval',
        minutes=1,
        args=[app],
        id='cleanup_pending_registrations',
        replace_existing=True
    )
    scheduler.start()