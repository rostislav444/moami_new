# Generated by Django 4.1.7 on 2023-06-28 19:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0011_category_product_preferred_size_grid'),
    ]

    operations = [
        migrations.RenameField(
            model_name='category',
            old_name='product_preferred_size_grid',
            new_name='preferred_size_grid',
        ),
    ]
