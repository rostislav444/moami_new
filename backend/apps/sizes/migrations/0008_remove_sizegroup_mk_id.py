# Generated by Django 4.2.4 on 2023-12-01 12:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sizes', '0007_sizegroup_mk_id_alter_size_mk_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sizegroup',
            name='mk_id',
        ),
    ]
