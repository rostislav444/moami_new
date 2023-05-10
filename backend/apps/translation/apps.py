from django.apps import AppConfig
from apps.translation.utils.create_model import create_translation_model
from apps.translation.utils.create_model_admin import create_model_admin


class TranslationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.translation'

    def ready(self):
        from apps.translation.models import Translatable

        for model in Translatable.__subclasses__():
            translation_model = create_translation_model(model)
            create_model_admin(model, translation_model)

