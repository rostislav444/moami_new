# Generated by Django 4.2.4 on 2023-09-04 12:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_user_username'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='uuid',
            new_name='id',
        ),
    ]
