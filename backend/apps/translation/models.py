from django.db import models
from django.utils.translation import get_language as language
from project import settings

from django.core.exceptions import ObjectDoesNotExist


# class TranslatableManager(models.Manager):
#     def get_queryset(self):
#         current_language = language()
#         if current_language == settings.LANGUAGE_CODE:
#             return super().get_queryset()
#         return super().get_queryset().prefetch_related('translations').filter(translations__language_code=current_language)


class Translatable(models.Model):
    class Meta:
        abstract = True

    translatable_fields = []

    def __init__(self, *args, **kwargs):
        for field in self._meta.get_fields():
            if isinstance(field, models.CharField) or isinstance(field, models.TextField):
                if field.name not in self.translatable_fields:
                    self.translatable_fields.append(field.name)
        super().__init__(*args, **kwargs)

    @property
    def get_translatable_fields(self):
        fields = []
        for field in self._meta.get_fields():
            if isinstance(field, models.CharField) or isinstance(field, models.TextField):
                fields.append(field.name)
        return fields

    def __getattribute__(self, name):
        current_language = language()

        if name in ['_meta', 'objects', 'translatable_fields']:
            return super().__getattribute__(name)

        if current_language != settings.LANGUAGE_CODE:
            if name in self.translatable_fields:
                try:
                    translated_instance = super().__getattribute__('translations').get(language_code=current_language)
                    return getattr(translated_instance, name)
                except ObjectDoesNotExist:
                    pass

        return super().__getattribute__(name)
