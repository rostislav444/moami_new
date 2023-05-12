from django.db import models

from apps.abstract.models import NameSlug
from apps.translation.models import Translatable


class AttributeGroup(NameSlug, Translatable):
    class Meta:
        verbose_name = 'Группа атрибутов'
        verbose_name_plural = 'Группы атрибутов'

    def __str__(self):
        return self.name


class Attribute(NameSlug, Translatable):
    attribute_group = models.ForeignKey('AttributeGroup', on_delete=models.CASCADE, related_name='attributes')

    class Meta:
        verbose_name = 'Атрибут'
        verbose_name_plural = 'Атрибуты'

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