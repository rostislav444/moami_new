# Generated by Django 4.2.4 on 2023-10-02 08:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0043_remove_product_taxonomy'),
    ]

    operations = [
        migrations.AddField(
            model_name='variant',
            name='rozetka_code',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
