# Generated by Django 4.2.4 on 2023-09-06 17:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0028_alter_brandtranslation_language_code_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='variantimagethumbnail',
            name='exclude',
            field=models.BooleanField(default=False),
        ),
    ]
