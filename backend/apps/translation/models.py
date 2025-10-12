from django.apps import apps
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
                translation_instance = self._get_translation_instance(lang[0])
                if translation_instance:
                    translations[lang[0]] = getattr(translation_instance, field)
                else:
                    translations[lang[0]] = getattr(self, field)
            return translations
        else:
            translation_instance = self._get_translation_instance(lang)
            if translation_instance:
                return getattr(translation_instance, field)
            return getattr(self, field)

    def get_translation_model(self):
        app = self.__class__._meta.app_label
        model = self.__class__.__name__
        return apps.get_model(app, model + 'Translation')

    def create_translations(self):
        transaction_model = self.get_translation_model()
        fields = self.get_translatable_fields

        for lang_code, _ in settings.FOREIGN_LANGUAGES:
            item, created = transaction_model.objects.get_or_create(
                parent=self,
                language_code=lang_code
            )

            needs_save = False

            for field in fields:
                current_field_value = getattr(item, field, None)
                if not current_field_value or current_field_value.strip() == "":
                    source_value = getattr(self, field)
                    if source_value and source_value.strip():
                        translator = EasyGoogleTranslate(source_language='ru', target_language=lang_code, timeout=10)
                        translated_value = translator.translate(source_value)
                        setattr(item, field, translated_value)
                        needs_save = True

            if needs_save:
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
                translated_instance = self._get_translation_instance(current_language)
                if translated_instance:
                    value = getattr(translated_instance, name)
                    if value:
                        return value
        return super().__getattribute__(name)

    def _get_translation_instance(self, lang_code):
        translations_manager = getattr(self, 'translations', None)
        if translations_manager is None:
            return None

        try:
            queryset = translations_manager.filter(language_code=lang_code).order_by('pk')
            instances = list(queryset)
            if not instances:
                return None

            primary = instances[0]

            if len(instances) > 1:
                duplicates = [item.pk for item in instances[1:]]
                model_class = queryset.model
                if duplicates and model_class:
                    model_class.objects.filter(pk__in=duplicates).delete()

            return primary
        except Exception:
            return None
