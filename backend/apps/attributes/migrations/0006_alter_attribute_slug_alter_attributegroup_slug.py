# Generated by Django 4.1.7 on 2023-04-29 16:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attributes', '0005_alter_composition_slug'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attribute',
            name='slug',
            field=models.SlugField(blank=True, editable=False, max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='attributegroup',
            name='slug',
            field=models.SlugField(blank=True, editable=False, max_length=255, unique=True),
        ),
    ]
