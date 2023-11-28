import os

from django.core.exceptions import ValidationError


def validate_txt(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.txt']
    if not ext.lower() in valid_extensions:
        raise ValidationError(u'Требуется файл с расширением .txt')


def validate_csv(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.csv']
    if not ext.lower() in valid_extensions:
        raise ValidationError(u'Требуется файл с расширением .csv')