# Generated by Django 4.2.4 on 2023-09-26 09:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0005_alter_rozetkacategories_rozetka_id'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='googletaxonomy',
            options={'ordering': ['name'], 'verbose_name': 'Категории: категория Google Taxonomy', 'verbose_name_plural': '2. Категории: категории Google Taxonomy'},
        ),
        migrations.AlterModelOptions(
            name='googletaxonomyuplaoder',
            options={'verbose_name': 'Загрузчик: категория Google Taxonomy', 'verbose_name_plural': '3. Загрузчик: категории Google Taxonomy'},
        ),
        migrations.AlterModelOptions(
            name='rozetkacategories',
            options={'verbose_name': 'Категория Rozetka', 'verbose_name_plural': '1. Категории Rozetka'},
        ),
        migrations.RenameField(
            model_name='googletaxonomyuplaoder',
            old_name='delate_all',
            new_name='delete_all',
        ),
        migrations.AlterField(
            model_name='googletaxonomyuplaoder',
            name='table',
            field=models.FileField(help_text='.txt', upload_to='google_taxonomy'),
        ),
        migrations.AlterField(
            model_name='googletaxonomyuplaoder',
            name='table_ru',
            field=models.FileField(help_text='.txt', upload_to='google_taxonomy'),
        ),
    ]
