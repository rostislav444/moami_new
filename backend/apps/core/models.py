from django.db import models


class Unit(models.Model):
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Единица измерения'
        verbose_name_plural = 'Единицы измерения'
        ordering = ['name']

    def __str__(self):
        return self.name


