import csv

from django.db import models
from mptt.models import MPTTModel, TreeForeignKey

from apps.core.utils.validators import validate_csv


class FacebookCategories(MPTTModel):
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=1000)
    full_name = models.CharField(max_length=1000, blank=True, null=True)
    facebook_id = models.CharField(max_length=24, blank=True, null=True)

    class MPTTMeta:
        order_insertion_by = ['full_name']

    class Meta:
        verbose_name = 'Категория Facebook'
        verbose_name_plural = '5. Категории Facebook'

    def __str__(self):
        return self.name


class FacebookCategoriesLoader(models.Model):
    table = models.FileField(upload_to='facebook_categories', help_text='.csv', validators=[validate_csv],
                             verbose_name='Таблица со списком категорий (.csv)')
    filter_root = models.CharField(max_length=1000, blank=True, null=True, default='clothing & accessories')
    delete_all = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Загрузчик: категория Facebook'
        verbose_name_plural = '6. Загрузчик: категории Facebook'

    def save(self):
        if self.delete_all:
            FacebookCategories.objects.all().delete()

        super(FacebookCategoriesLoader, self).save()

        with open(self.table.path, 'r', encoding='utf-8') as categories:
            reader = csv.reader(categories)
            for row in reader:
                if len(row) == 2:
                    facebook_id, full_name = row
                    category_name_parts = full_name.split(' > ')

                    if self.filter_root and category_name_parts[0] != self.filter_root:
                        continue

                    parent = None
                    for i in range(len(category_name_parts)):
                        parent_name = category_name_parts[i]
                        parent_full_name = ' > '.join(category_name_parts[:i + 1])

                        category, created = FacebookCategories.objects.get_or_create(
                            full_name=parent_full_name,
                            defaults={'name': parent_name,
                                      'facebook_id': facebook_id if i == len(category_name_parts) - 1 else None,
                                      'parent': parent}
                        )

                        if i == len(category_name_parts) - 1 and not created:
                            category.facebook_id = facebook_id
                            category.save()

                        parent = category
