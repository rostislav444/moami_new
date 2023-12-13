from django.db import models
from easygoogletranslate import EasyGoogleTranslate

from apps.abstract.models import NameSlug
from apps.translation.models import Translatable


class AttributeGroup(NameSlug, Translatable):
    ATTR_TYPE_CHOICES = (
        ('multi_attr', 'Множественный выбор'),
        ('single_attr', 'Единичный выбор'),
        ('integer', 'Число'),
        ('sting', 'Строка'),
    )
    slug = models.SlugField(max_length=255, blank=True, editable=False)
    mk_key_name = models.CharField(max_length=255, null=True, blank=True)
    mk_type = models.CharField(max_length=255, null=True, blank=True)
    data_type = models.CharField(max_length=50, choices=ATTR_TYPE_CHOICES, default=ATTR_TYPE_CHOICES[0][0])

    class Meta:
        verbose_name = 'Группа атрибутов'
        verbose_name_plural = 'Группы атрибутов'
        ordering = ('name',)

    def __str__(self):
        required = self.categories.filter(required=True).count()
        if required > 0:
            return self.name + ' *'
        return self.name


class Attribute(NameSlug, Translatable):
    slug = models.SlugField(max_length=255, blank=True, editable=False)
    attribute_group = models.ForeignKey('AttributeGroup', on_delete=models.CASCADE, related_name='attributes')
    mk_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = 'Атрибут'
        verbose_name_plural = 'Атрибуты'
        ordering = ('name',)

    def __str__(self):
        return self.name


class Composition(NameSlug, Translatable):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, null=True, blank=True, editable=False)

    class Meta:
        verbose_name = 'Состав'
        verbose_name_plural = 'Состав'

    def __str__(self):
        return self.name
