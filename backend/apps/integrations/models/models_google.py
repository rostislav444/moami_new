from django.db import models

from apps.core.utils.validators import validate_txt


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
        if self.name_ru:
            self.name_ru = self.name_ru.encode('iso-8859-1').decode('utf-8', 'ignore')
        super(GoogleTaxonomy, self).save(*args, **kwargs)



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

            for line_ru in taxonomy_ru:
                if line_ru.startswith('#'):
                    continue

                taxonomy_id, taxonomy_name_ru = line_ru.split(' - ')

                try:
                    taxonomy = GoogleTaxonomy.objects.get(id=taxonomy_id)
                except GoogleTaxonomy.DoesNotExist:
                    continue
                taxonomy.name_ru = taxonomy_name_ru
                taxonomy.save()


__all__ = [
    'GoogleTaxonomy',
    'GoogleTaxonomyUplaoder'
]
