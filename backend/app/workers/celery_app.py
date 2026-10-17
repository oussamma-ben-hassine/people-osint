from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "people_osint_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    beat_schedule={
        "cleanup-expired-osint-data": {
            "task": "app.workers.tasks.cleanup_expired_data_task",
            "schedule": 86400.0, # Run once a day
        },
    }
)
