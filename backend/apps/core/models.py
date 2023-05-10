from django.db import models


class Unit(models.Model):
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name