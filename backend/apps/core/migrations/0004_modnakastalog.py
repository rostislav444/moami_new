# Generated by Django 4.2.4 on 2023-11-28 16:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_modnakastatolen'),
    ]

    operations = [
        migrations.CreateModel(
            name='ModnaKastaLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(max_length=3)),
                ('url', models.CharField(max_length=255)),
                ('payload', models.JSONField(default=dict)),
                ('message', models.JSONField(default=dict)),
            ],
        ),
    ]