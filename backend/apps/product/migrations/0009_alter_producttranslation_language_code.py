# Generated by Django 4.1.7 on 2023-05-09 18:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0008_remove_producttranslation_description_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='producttranslation',
            name='language_code',
            field=models.CharField(choices=[('uk-ua', 'Ukrainian'), ('en-us', 'English')], max_length=6),
        ),
    ]
