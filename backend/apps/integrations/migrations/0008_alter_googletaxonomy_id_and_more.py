# Generated by Django 4.2.4 on 2023-09-26 09:58

import apps.integrations.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0007_alter_googletaxonomyuplaoder_table_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='googletaxonomy',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='googletaxonomyuplaoder',
            name='table_ru',
            field=models.FileField(help_text='.txt', upload_to='google_taxonomy', validators=[apps.core.utils.validators.validate_txt], verbose_name='Таблица на русском (.txt)'),
        ),
    ]
