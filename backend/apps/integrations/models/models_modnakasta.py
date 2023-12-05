from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class ModnaKastaTolen(models.Model):
    token = models.CharField(max_length=255)

    class Meta:
        verbose_name = '7. Модна Каста: Токен '
        verbose_name_plural = '7. Модна Каста: Токен'

    def __str__(self):
        return self.token


class ModnaKastaCategories(MPTTModel):
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=128)
    name_alias = models.CharField(max_length=128)
    kind_id = models.PositiveIntegerField(default=0)
    affiliation_id = models.PositiveIntegerField()

    class MPTTMeta:
        order_insertion_by = ['name_alias']

    class Meta:
        verbose_name = '8. Модна Каста: Категории'
        verbose_name_plural = '8. Модна Каста: Категории'

    def __str__(self):
        return self.name_alias


class ModnaKastaLog(models.Model):
    status = models.CharField(max_length=3)
    url = models.CharField(max_length=255)
    payload = models.JSONField(default=dict)
    message = models.JSONField(default=dict)
    date = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '9. Модна Каста: Лог'
        verbose_name_plural = '9. Модна Каста: Лог'

    def __str__(self):
        return self.status


__all__ = [
    'ModnaKastaTolen',
    'ModnaKastaLog',
    'ModnaKastaCategories'
]
