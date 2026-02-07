from django.db import models
from django.utils import timezone


class Marketplace(models.Model):
    """Универсальная модель маркетплейса"""

    INTEGRATION_TYPE_CHOICES = [
        ('xml_feed', 'XML Feed'),
        ('api', 'API Integration'),
        ('both', 'XML + API'),
    ]

    name = models.CharField(max_length=255, verbose_name='Название')
    slug = models.SlugField(unique=True, verbose_name='Slug')
    integration_type = models.CharField(
        max_length=20,
        choices=INTEGRATION_TYPE_CHOICES,
        default='xml_feed',
        verbose_name='Тип интеграции'
    )

    # API Configuration (JSON)
    api_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Конфигурация API',
        help_text='''
        Пример: {
            "base_url": "https://api.epicentrm.com.ua",
            "auth_type": "bearer",
            "token": "xxx",
            "endpoints": {
                "categories": "/v2/pim/categories",
                "attribute_sets": "/v2/pim/attribute-sets"
            }
        }
        '''
    )

    # Feed Configuration
    feed_template = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Путь к шаблону фида',
        help_text='Например: feed/epicentr/'
    )
    feed_filename = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Имя файла фида',
        help_text='Например: epicentr.xml'
    )
    feed_url = models.URLField(
        blank=True,
        verbose_name='URL фида',
        help_text='Публичный URL для доступа к фиду'
    )

    # Status
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    last_sync = models.DateTimeField(null=True, blank=True, verbose_name='Последняя синхронизация')
    last_feed_generated = models.DateTimeField(null=True, blank=True, verbose_name='Последняя генерация фида')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Маркетплейс'
        verbose_name_plural = 'Маркетплейсы'
        ordering = ['name']

    def __str__(self):
        return self.name

    def update_last_sync(self):
        self.last_sync = timezone.now()
        self.save(update_fields=['last_sync'])

    def update_last_feed_generated(self):
        self.last_feed_generated = timezone.now()
        self.save(update_fields=['last_feed_generated'])
