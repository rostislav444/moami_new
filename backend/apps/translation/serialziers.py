from rest_framework import serializers

from project import settings


class TranslationFiled(serializers.Field):
    def bind(self, field_name, parent):
        super().bind(field_name, parent)

    def to_representation(self, value):
        language = self.context.get('language')
        if language is None:
            language = settings.LANGUAGE_CODE
        return value[language]
