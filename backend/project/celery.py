import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('project')

# Using RabbitMQ as the broker
app.conf.broker_url = 'amqp://user:password@localhost:5672//'
app.conf.broker_connection_retry_on_startup = True

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

app.conf.beat_schedule = {
    # 'sync_all_balance': {
    #     'task': 'apps.payments.tasks.sync_all_balance',
    #     'schedule': crontab(minute='*/60'),
    #     'options': {'queue': 'default'}
    # },
}
