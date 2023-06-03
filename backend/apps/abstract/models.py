from django.db import models
from django.utils.text import slugify
from unidecode import unidecode
from apps.abstract.fields import DeletableImageField

class NameSlug(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.slug = slugify(unidecode(self.name), allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# class ParentImageThumbnails(models.Model):
#     image = DeletableImageField()
#
#     class Meta:
#         abstract = True
