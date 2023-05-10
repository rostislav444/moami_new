from django.core.exceptions import ValidationError
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

from apps.abstract.fields import DeletableImageField
from apps.sizes.models import SizeGroup
from apps.abstract.models import NameSlug
from apps.attributes.models import AttributeGroup


class Category(NameSlug, MPTTModel):
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    size_group = models.ForeignKey(SizeGroup, null=True, blank=True, on_delete=models.PROTECT,
                                   related_name='categories')

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.parent and not self.size_group and self.parent.size_group:
            self.size_group = self.parent.size_group
        super(Category, self).save(*args, **kwargs)

    def _check_attribute_groups(self):
        attribute_groups = self.attribute_groups.all().values_list('id', flat=True)
        for ancestor in self.get_ancestors():
            if ancestor.attribute_groups.filter(id__in=attribute_groups).exists():
                raise ValidationError(
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
        return '{} - {}'.format(self.category, self.attribute_group)


class Collections(NameSlug):
    image = DeletableImageField(upload_to='collections', blank=True, null=True, verbose_name='Изображение')

    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'

    def __str__(self):
        return self.name