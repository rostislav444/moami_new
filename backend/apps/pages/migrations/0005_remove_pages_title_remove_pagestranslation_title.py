# Generated by Django 4.1.7 on 2023-06-17 16:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0004_pages_pagestranslation_homeslidertranslation'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pages',
            name='title',
        ),
        migrations.RemoveField(
            model_name='pagestranslation',
            name='title',
        ),
    ]