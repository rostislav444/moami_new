from django.apps import AppConfig


class IntegrationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.integrations'
    verbose_name = 'Интеграции'
    verbose_name_plural = 'Интеграции'

    def ready(self):
        import apps.integrations.signals

