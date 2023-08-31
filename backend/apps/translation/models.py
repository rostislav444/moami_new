from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db import transaction
from django.utils.translation import get_language as language

from project import settings


class TranslatableManager(models.Manager):
    def get_queryset(self):
        current_language = language()
        if current_language == settings.LANGUAGE_CODE:
            return super().get_queryset()
        return super().get_queryset().prefetch_related('translations')


class Translatable(models.Model):
    objects = TranslatableManager()

    class Meta:
        abstract = True

    translatable_fields = []
    exclude_translation = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.translatable_fields = []
        self.fields = self._meta.get_fields()
        for field in self.fields:
            if isinstance(field, (models.CharField, models.TextField)) and field.name not in ['slug']:
                if field.name != 'slug' and field.name not in self.exclude_translation:
                    self.translatable_fields.append(field.name)

    @property
    def get_translatable_fields(self):
        fields = []
        for field in self._meta.get_fields():
            if isinstance(field, models.CharField) or isinstance(field, models.TextField):
                if field.name != 'slug' and field.name not in self.exclude_translation:
                    fields.append(field.name)
        return fields

    def __getattribute__(self, name):
        exclude_fields = [
            '_meta',
            '_state',
            '__class__',
            'get_source_expressions',
            'resolve_expression',
            'objects',
            'translatable_fields'
        ]

        if name in exclude_fields:
            return super().__getattribute__(name)

        current_language = language()

        if current_language != settings.LANGUAGE_CODE:
            if name in self.translatable_fields:
                if not transaction.get_autocommit():
                    return super().__getattribute__(name)
                try:
                    translated_instance = super().__getattribute__('translations').get(language_code=current_language)
                    value = getattr(translated_instance, name)
                    if value:
                        return value
                    return super().__getattribute__(name)
                except (ObjectDoesNotExist, ValueError):
                    pass
        return super().__getattribute__(name)
