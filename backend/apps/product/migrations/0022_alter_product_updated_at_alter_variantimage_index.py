# Generated by Django 4.1.7 on 2023-06-27 18:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0021_alter_product_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='variantimage',
            name='index',
            field=models.PositiveIntegerField(default=0),
        ),
    ]