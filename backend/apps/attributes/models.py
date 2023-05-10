from django.db import models

from apps.abstract.models import NameSlug


class AttributeGroup(NameSlug):
    pass


class Attribute(NameSlug):
    attribute_group = models.ForeignKey('AttributeGroup', on_delete=models.CASCADE, related_name='attributes')

    def __str__(self):
        return self.name


class Composition(NameSlug):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, null=True, blank=True, editable=False)

    def __str__(self):
        return self.name