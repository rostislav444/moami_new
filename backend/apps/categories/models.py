from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count, Sum
from mptt.models import MPTTModel, TreeForeignKey

from apps.abstract.fields import DeletableImageField
from apps.abstract.models import NameSlug
from apps.attributes.models import AttributeGroup
from apps.sizes.models import SizeGrid, SizeGroup
from apps.translation.models import Translatable


class Category(NameSlug, MPTTModel, Translatable):
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    size_group = models.ForeignKey(SizeGroup, null=True, blank=True, on_delete=models.PROTECT,
                                   related_name='categories')
    preferred_size_grid = models.ForeignKey(SizeGrid, null=True, blank=True, on_delete=models.SET_NULL,
                                            verbose_name='предпочтительная размерная сетка')
    ordering = models.PositiveIntegerField(default=0, blank=False, null=False)
    image = DeletableImageField(upload_to='categories', blank=True, null=True, verbose_name='Изображение')

    class MPTTMeta:
        order_insertion_by = ['ordering', 'name']

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ('ordering',)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.parent and not self.size_group and self.parent.size_group:
            self.size_group = self.parent.size_group

        if not self.children.exists() and not self.size_group:
            raise ValidationError('У этой категории должна быть размерная сетка')
        super(Category, self).save(*args, **kwargs)

    def get_products_count(self):
        # count variants in current category
        count = self.products.annotate(num_variants=Count('variants')).aggregate(total=Sum('num_variants'))[
                    'total'] or 0

        # recursively add counts from child categories
        for child in self.get_children():
            count += child.get_products_count()

        return count

    def _check_attribute_groups(self):
        # Get all attribute group IDs associated with the current instance
        attribute_groups = self.attribute_groups.all().values_list('id', flat=True)

        # Iterate over all ancestor categories of the current instance
        for ancestor in self.get_ancestors():
            # Check if any of the attribute groups of the current instance are also present in the ancestor category
            if ancestor.attribute_groups.filter(id__in=attribute_groups).exists():
                # If a conflict is found, raise a ValidationError
                raise ValidationError(
                    # The error message includes the IDs of the conflicting attribute groups and the ancestor category
                    'Attribute group(s) "{}" already exist in ancestor category "{}".'.format(
                        ', '.join(str(ag) for ag in attribute_groups.intersection(ancestor.attribute_groups.all())),
                        ancestor
                    )
                )

    def clean(self):
        super().clean()

        if self.id and self.attribute_groups.exists():
            self._check_attribute_groups()


class CategoryAttributeGroup(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='attribute_groups')
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE, related_name='categories')
    required = models.BooleanField(default=False)

    class Meta:
        unique_together = ('category', 'attribute_group')
        verbose_name = 'Attribute group'
        verbose_name_plural = 'Attribute groups'

    def __str__(self):
        return ''
        # return '{} - {}'.format(self.category, self.attribute_group)


class Collections(NameSlug):
    image = DeletableImageField(upload_to='collections', blank=True, null=True, verbose_name='Изображение')

    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'

    def __str__(self):
        return self.name

    def get_products_count(self):
        return self.products.annotate(num_variants=Count('variants')).aggregate(total=Sum('num_variants'))['total'] or 0
