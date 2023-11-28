from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from mptt.models import MPTTModel, TreeForeignKey

from apps.abstract.fields import DeletableFileField
from apps.abstract.models import NameSlug
from apps.integrations.utils import rozetka_adaptation_util


class RozetkaCategories(NameSlug, MPTTModel):
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    rozetka_id = models.CharField(max_length=24)

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        verbose_name = 'Категория Rozetka'
        verbose_name_plural = '1. Категории Rozetka'

    def __str__(self):
        categories = self.get_ancestors(include_self=True)
        if categories.count():
            return ' / '.join([c.name for c in categories])
        return self.name


class RozetkaAdaptation(models.Model):
    table = DeletableFileField(upload_to='rozetka_adaptation')

    class Meta:
        verbose_name = 'Адаптация Rozetka'
        verbose_name_plural = '2. Адаптация Rozetka'

    def __str__(self):
        return 'RozetkaAdaptation'



@receiver(post_save, sender=RozetkaAdaptation)
def post_save_rozetka_adaptation(sender, instance, created, **kwargs):
    if instance:
        rozetka_adaptation_util(instance.table)



__all__ = [
    'RozetkaCategories',
    'RozetkaAdaptation',
    'post_save_rozetka_adaptation'
]
