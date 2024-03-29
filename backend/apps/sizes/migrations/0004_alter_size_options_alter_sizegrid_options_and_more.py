# Generated by Django 4.1.7 on 2023-06-11 12:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sizes', '0003_alter_sizeproperty_slug'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='size',
            options={'ordering': ['order', 'group__name'], 'verbose_name': 'Размер', 'verbose_name_plural': 'Размеры'},
        ),
        migrations.AlterModelOptions(
            name='sizegrid',
            options={'ordering': ['order', 'name'], 'verbose_name': 'Размерная сетка', 'verbose_name_plural': 'Размерные сетки'},
        ),
        migrations.AlterModelOptions(
            name='sizegroup',
            options={'ordering': ['name'], 'verbose_name': 'Группа размеров', 'verbose_name_plural': 'Группы размеров'},
        ),
        migrations.AlterModelOptions(
            name='sizeinterpretation',
            options={'ordering': ['grid__order'], 'verbose_name': 'Интерпретация размера', 'verbose_name_plural': 'Интерпретация размеров'},
        ),
        migrations.AlterModelOptions(
            name='sizeproperty',
            options={'ordering': ['name'], 'verbose_name': 'Параметр размера', 'verbose_name_plural': 'Параметры размеров'},
        ),
    ]
