# Generated by Django 4.1.7 on 2023-05-18 13:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0015_alter_color_code_alter_color_name_colortranslation'),
    ]

    operations = [
        migrations.AddField(
            model_name='variantimage',
            name='index',
            field=models.PositiveIntegerField(default=0, editable=False),
        ),
    ]
