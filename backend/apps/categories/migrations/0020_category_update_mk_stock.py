# Generated by Django 4.2.4 on 2023-11-28 21:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0019_category_modna_kast_category_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='update_mk_stock',
            field=models.BooleanField(default=False),
        ),
    ]