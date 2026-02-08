from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class BackgroundTask(models.Model):
    """Database-backed task queue (запуск через threading)"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    TASK_TYPE_CHOICES = [
        ('pipeline_run', 'Pipeline Execution'),
        ('research_agent', 'AI Research'),
        ('sync_operation', 'Sync Operation'),
        ('file_download', 'File Download'),
        ('ai_processing', 'AI Processing'),
    ]

    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    name = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    payload = models.JSONField(
        default=dict,
        help_text='Task input parameters'
    )
    result = models.JSONField(
        null=True,
        blank=True,
        help_text='Task output/result'
    )
    error = models.TextField(blank=True)
    progress = models.IntegerField(
        default=0,
        help_text='Progress percentage 0-100'
    )
    progress_message = models.CharField(
        max_length=255,
        blank=True,
        help_text='Current progress message'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Generic FK for linking to specific objects
    content_type = models.ForeignKey(
        ContentType,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Background Task'
        verbose_name_plural = 'Background Tasks'
        indexes = [
            models.Index(fields=['status', 'task_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.task_type}: {self.name or self.id} ({self.status})"

    @property
    def duration(self):
        """Длительность выполнения в секундах"""
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        elif self.started_at:
            return (timezone.now() - self.started_at).total_seconds()
        return None

    def start(self):
        """Отметить задачу как запущенную"""
        self.status = 'running'
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])

    def complete(self, result=None):
        """Отметить задачу как выполненную"""
        self.status = 'completed'
        self.progress = 100
        self.finished_at = timezone.now()
        if result is not None:
            self.result = result
        self.save(update_fields=['status', 'progress', 'finished_at', 'result'])

    def fail(self, error_message):
        """Отметить задачу как неудачную"""
        self.status = 'failed'
        self.error = error_message
        self.finished_at = timezone.now()
        self.save(update_fields=['status', 'error', 'finished_at'])

    def cancel(self):
        """Отменить задачу"""
        if self.status in ('pending', 'running'):
            self.status = 'cancelled'
            self.finished_at = timezone.now()
            self.save(update_fields=['status', 'finished_at'])
            return True
        return False

    def update_progress(self, percent, message=''):
        """Обновить прогресс задачи"""
        self.progress = min(100, max(0, percent))
        self.progress_message = message[:255]
        self.save(update_fields=['progress', 'progress_message'])

    @classmethod
    def create_for_pipeline(cls, pipeline_run):
        """Создать задачу для выполнения пайплайна"""
        from django.contrib.contenttypes.models import ContentType
        return cls.objects.create(
            task_type='pipeline_run',
            name=f"Pipeline: {pipeline_run.pipeline.name}",
            payload={'pipeline_run_id': pipeline_run.id},
            content_type=ContentType.objects.get_for_model(pipeline_run),
            object_id=pipeline_run.id
        )

    @classmethod
    def create_for_research(cls, conversation):
        """Создать задачу для AI исследования"""
        from django.contrib.contenttypes.models import ContentType
        return cls.objects.create(
            task_type='research_agent',
            name=f"Research: {conversation.marketplace.name}",
            payload={'conversation_id': conversation.id},
            content_type=ContentType.objects.get_for_model(conversation),
            object_id=conversation.id
        )
