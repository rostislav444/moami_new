# Generated by Django 4.2.1 on 2023-06-13 12:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0003_homeslider_link'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='homeslider',
            name='link_type',
        ),
    ]
