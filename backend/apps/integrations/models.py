import csv
import os

from django.core.exceptions import ValidationError
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


class GoogleTaxonomy(models.Model):
    id = models.PositiveIntegerField(primary_key=True)
    name = models.CharField(max_length=1000)
    name_ru = models.CharField(max_length=1000, blank=True, null=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Категории: категория Google Taxonomy'
        verbose_name_plural = '3. Категории: категории Google Taxonomy'

    def __str__(self):
        if self.name_ru:
            return self.name_ru.split(' > ')[-1]
        return self.name

    def save(self, *args, **kwargs):
        super(GoogleTaxonomy, self).save(*args, **kwargs)


def validate_txt(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.txt']
    if not ext.lower() in valid_extensions:
        raise ValidationError(u'Требуется файл с расширением .txt')


def validate_csv(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.csv']
    if not ext.lower() in valid_extensions:
        raise ValidationError(u'Требуется файл с расширением .csv')


class GoogleTaxonomyUplaoder(models.Model):
    table = models.FileField(upload_to='google_taxonomy', help_text='.txt', validators=[validate_txt],
                             verbose_name='Таблица на английском (.txt)')
    table_ru = models.FileField(upload_to='google_taxonomy', help_text='.txt', validators=[validate_txt],
                                verbose_name='Таблица на русском (.txt)')
    filter_root = models.CharField(max_length=1000, blank=True, null=True, default='Apparel & Accessories')
    delete_all = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Загрузчик: категория Google Taxonomy'
        verbose_name_plural = '4. Загрузчик: категории Google Taxonomy'

    def save(self):
        if self.delete_all == True:
            GoogleTaxonomy.objects.all().delete()

        super(GoogleTaxonomyUplaoder, self).save()

        with open(self.table.path) as taxonomy_en, open(self.table_ru.path) as taxonomy_ru:
            for line_en in taxonomy_en:
                if line_en.startswith('#'):
                    continue

                line_en = line_en.replace('\n', '')
                taxonomy_id, taxonomy_name_en = line_en.split(' - ')

                if self.filter_root:
                    if not taxonomy_name_en.startswith(self.filter_root):
                        continue

                obj, _ = GoogleTaxonomy.objects.get_or_create(id=taxonomy_id, name=taxonomy_name_en)
                print(obj)

            for line_ru in taxonomy_ru:
                line_ru = line_ru.encode('latin1').decode('utf-8')
                if line_ru.startswith('#'):
                    continue
                line_ru = line_ru.replace('\n', '')
                taxonomy_id, taxonomy_name_ru = line_ru.split(' - ')
                try:
                    taxonomy = GoogleTaxonomy.objects.get(id=taxonomy_id)
                except GoogleTaxonomy.DoesNotExist:
                    continue
                taxonomy.name_ru = taxonomy_name_ru
                taxonomy.save()
                print(taxonomy)


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


@receiver(post_save, sender=RozetkaAdaptation)
def post_save_rozetka_adaptation(sender, instance, created, **kwargs):
    if instance:
        rozetka_adaptation_util(instance.table)

