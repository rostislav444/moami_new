# Generated by Django 4.2.1 on 2023-07-27 08:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0004_alter_rozetkacategories_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rozetkacategories',
            name='rozetka_id',
            field=models.CharField(max_length=24),
        ),
    ]
