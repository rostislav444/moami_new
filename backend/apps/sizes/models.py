from django.core.exceptions import ValidationError
from django.db import models

from apps.abstract.models import NameSlug


class SizeGrid(NameSlug):
    order = models.PositiveSmallIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Размерная сетка'
        verbose_name_plural = 'Размерные сетки'


class SizeGroup(NameSlug):
    grids = models.ManyToManyField(SizeGrid, related_name='groups')

    class Meta:
        ordering = ['name']
        verbose_name = 'Группа размеров'
        verbose_name_plural = 'Группы размеров'

    def save(self, *args, **kwargs):
        # Check if at least one grid is associated
        if not self.grids.exists():
            raise ValidationError("At least one grid must be selected.")
        super(SizeGroup, self).save(*args, **kwargs)


class Size(models.Model):
    group = models.ForeignKey(SizeGroup, on_delete=models.CASCADE, related_name='sizes')
    order = models.PositiveSmallIntegerField(default=0)
    mk_id = models.CharField(max_length=25, null=True, blank=True)

    class Meta:
        ordering = ['order', 'group__name']
        verbose_name = 'Размер'
        verbose_name_plural = 'Размеры'

    def get_interpretations_dict(self):
        interpretations = self.interpretations.all()
        if interpretations.exists():
            return {interpretation.grid.slug: interpretation.value for interpretation in interpretations}
        return {}

    def __str__(self):
        data = self.get_interpretations_dict()
        return ', '.join([f'{k}: {data[k]}' for k in set(data.keys())])


class SizeInterpretation(models.Model):
    size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='interpretations')
    grid = models.ForeignKey(SizeGrid, on_delete=models.CASCADE, related_name='interpretations')
    value = models.CharField(max_length=255)

    class Meta:
        ordering = ['grid__order']
        verbose_name = 'Интерпретация размера'
        verbose_name_plural = 'Интерпретация размеров'


class SizeProperty(NameSlug):
    slug = models.SlugField(max_length=255, blank=True, editable=False)
    size_group = models.ForeignKey(SizeGroup, on_delete=models.CASCADE, related_name='properties')
    unit = models.ForeignKey('core.Unit', on_delete=models.PROTECT)

    class Meta:
        ordering = ['name']
        verbose_name = 'Параметр размера'
        verbose_name_plural = 'Параметры размеров'

    def __str__(self):
        return self.name


class SizePropertyValue(models.Model):
    size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='properties')
    property = models.ForeignKey(SizeProperty, on_delete=models.CASCADE, related_name='values')
    value = models.CharField(max_length=255)
