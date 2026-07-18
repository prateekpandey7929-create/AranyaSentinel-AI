from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from .escalation_service import check_and_escalate_alerts
import logging

logger = logging.getLogger("backend.scheduler")

scheduler = BackgroundScheduler()

def start_scheduler():
    """
    Initializes the background scheduler for the alert escalation engine.
    Runs the check every 1 minute.
    """
    if not scheduler.running:
        scheduler.add_job(
            check_and_escalate_alerts,
            trigger=IntervalTrigger(seconds=5),
            id="escalation_job",
            name="Check for unacknowledged alerts to escalate",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Escalation Background Scheduler Started. Running every 1 minute.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Escalation Background Scheduler Stopped.")
