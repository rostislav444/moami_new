from django.db import models


class MarketplacePipeline(models.Model):
    """Пайплайн синхронизации маркетплейса"""

    PURPOSE_CHOICES = [
        ('categories', 'Categories'),
        ('attributes', 'Attributes'),
        ('attribute_options', 'Attribute Options'),
        ('feed', 'Feed Generation'),
        ('other', 'Other'),
    ]

    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='pipelines'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default='other',
        help_text='Pipeline purpose: categories, attributes, or other'
    )
    is_active = models.BooleanField(default=True)
    config = models.JSONField(
        default=dict,
        help_text='Global pipeline configuration'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['marketplace', 'name']
        verbose_name = 'Marketplace Pipeline'
        verbose_name_plural = 'Marketplace Pipelines'

    def __str__(self):
        return f"{self.marketplace.name} - {self.name}"

    def create_run(self):
        """Создать новый запуск пайплайна"""
        return PipelineRun.objects.create(pipeline=self)


class PipelineStep(models.Model):
    """Шаг пайплайна"""

    STEP_TYPE_CHOICES = [
        ('download_file', 'Download File'),
        ('parse_xml', 'Parse XML Feed'),
        ('parse_json', 'Parse JSON'),
        ('parse_csv', 'Parse CSV'),
        ('parse_xlsx', 'Parse XLSX/Excel'),
        ('sync_categories', 'Sync Categories'),
        ('sync_attributes', 'Sync Attribute Sets'),
        ('sync_options', 'Sync Attribute Options'),
        ('sync_entities', 'Sync Entities (brands, colors, etc.)'),
        ('api_call', 'API Call'),
        ('transform_data', 'Transform Data'),
        ('ai_process', 'AI Processing'),
        ('validate', 'Validate Data'),
        ('generate_feed', 'Generate Feed'),
        ('custom', 'Custom Handler'),
    ]

    ON_ERROR_CHOICES = [
        ('stop', 'Stop pipeline'),
        ('skip', 'Skip and continue'),
        ('retry', 'Retry step'),
    ]

    pipeline = models.ForeignKey(
        MarketplacePipeline,
        on_delete=models.CASCADE,
        related_name='steps'
    )
    order = models.PositiveIntegerField(default=0)
    step_type = models.CharField(max_length=50, choices=STEP_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    config = models.JSONField(
        default=dict,
        help_text='Step-specific configuration'
    )
    is_enabled = models.BooleanField(default=True)
    on_error = models.CharField(
        max_length=20,
        choices=ON_ERROR_CHOICES,
        default='stop'
    )
    retry_count = models.PositiveIntegerField(default=3)
    timeout = models.PositiveIntegerField(
        default=300,
        help_text='Timeout in seconds'
    )

    class Meta:
        ordering = ['order']
        verbose_name = 'Pipeline Step'
        verbose_name_plural = 'Pipeline Steps'

    def __str__(self):
        return f"#{self.order} {self.name} ({self.step_type})"


class PipelineRun(models.Model):
    """Запись выполнения пайплайна"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    pipeline = models.ForeignKey(
        MarketplacePipeline,
        on_delete=models.CASCADE,
        related_name='runs'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    current_step = models.ForeignKey(
        PipelineStep,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='current_runs'
    )
    progress = models.JSONField(
        default=dict,
        help_text='Progress per step: {step_id: {status, result, error, duration}}'
    )
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pipeline Run'
        verbose_name_plural = 'Pipeline Runs'

    def __str__(self):
        return f"Run #{self.id} of {self.pipeline.name} ({self.status})"

    @property
    def duration(self):
        """Длительность выполнения"""
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None

    @property
    def completed_steps_count(self):
        """Количество выполненных шагов"""
        return sum(
            1 for step_data in self.progress.values()
            if step_data.get('status') == 'completed'
        )

    @property
    def total_steps_count(self):
        """Общее количество активных шагов"""
        return self.pipeline.steps.filter(is_enabled=True).count()

    @property
    def progress_percent(self):
        """Процент выполнения"""
        total = self.total_steps_count
        if total == 0:
            return 0
        return int((self.completed_steps_count / total) * 100)
