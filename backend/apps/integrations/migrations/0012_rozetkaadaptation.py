# Generated by Django 4.2.4 on 2023-10-02 07:20

import apps.abstract.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0011_googletaxonomyuplaoder_filter_root'),
    ]

    operations = [
        migrations.CreateModel(
            name='RozetkaAdaptation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('table', apps.abstract.fields.DeletableFileField(upload_to='rozetka_adaptation')),
            ],
        ),
    ]