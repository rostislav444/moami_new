# Generated by Django 4.2.4 on 2023-12-05 10:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0053_product_mk_attributes_copy_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variantimage',
            name='slug',
            field=models.SlugField(blank=True, max_length=1024),
        ),
    ]