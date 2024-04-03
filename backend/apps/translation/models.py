from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db import transaction
from django.utils.translation import get_language
from easygoogletranslate import EasyGoogleTranslate

from project import settings


class TranslatableManager(models.Manager):
    def get_queryset(self):
        current_language = get_language()
        if current_language == settings.LANGUAGE_CODE:
            return super().get_queryset()
        return super().get_queryset().prefetch_related('translations')


class Translatable(models.Model):
    auto_translate = models.BooleanField(default=True)

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
                if not any(field.name.endswith(val) for val in
                           ['slug', '_id']) and field.name not in self.exclude_translation:
                    fields.append(field.name)
        return fields

    def get_translation(self, field, lang=None):
        if lang is None:
            translations = {}
            for lang in settings.LANGUAGES:
                try:
                    translations[lang[0]] = getattr(self.translations.get(language_code=lang[0]), field)
                except ObjectDoesNotExist:
                    translations[lang[0]] = getattr(self, field)
            return translations
        else:
            try:
                return getattr(self.translations.get(language_code=lang), field)
            except ObjectDoesNotExist:
                return getattr(self, field)

    def get_translation_model(self):
        app = self.__class__._meta.app_label
        model = self.__class__.__name__
        return apps.get_model(app, model + 'Translation')

    def create_translations(self):
        transaction_model = self.get_translation_model()
        fields = self.get_translatable_fields

        translations = self.translations.all()
        if translations.count() > settings.FOREIGN_LANGUAGES:
            translations.delete()

        for lang_code, name in settings.FOREIGN_LANGUAGES:
            data = {}
            for field in fields:
                value = getattr(self, field)
                if value:
                    translator = EasyGoogleTranslate(source_language='ru', target_language=lang_code, timeout=10)
                    data[field] = translator.translate(value)

            try:
                item = transaction_model.objects.get(parent=self, language_code=lang_code)
            except ObjectDoesNotExist:
                item = transaction_model(parent=self, language_code=lang_code)
            for k, v in data.items():
                setattr(item, k, v)
            item.save()

    def save(self, *args, **kwargs):
        super(Translatable, self).save(*args, **kwargs)

        if self.auto_translate:
            self.create_translations()

    def __getattr__(self, item):
        if item.startswith('get_translation'):
            item_split = item.split('__')
            if len(item_split) == 2:
                field = item_split[1]
                return self.get_translation(field)
            elif len(item_split) == 3:
                field = item_split[1]
                lang = item_split[2]
                return self.get_translation(field, lang)
        return super().__getattribute__(item)

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

        current_language = get_language()

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
