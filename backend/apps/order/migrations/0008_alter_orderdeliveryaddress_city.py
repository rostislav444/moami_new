# Generated by Django 4.2 on 2023-08-28 14:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0007_orderdeliverynewpost_area_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='orderdeliveryaddress',
            name='city',
            field=models.CharField(default='Киев', max_length=100, verbose_name='Город'),
        ),
    ]