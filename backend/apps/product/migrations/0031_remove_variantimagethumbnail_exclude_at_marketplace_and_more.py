# Generated by Django 4.2.4 on 2023-09-06 17:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0030_rename_exclude_variantimagethumbnail_exclude_at_marketplace'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='variantimagethumbnail',
            name='exclude_at_marketplace',
        ),
        migrations.AddField(
            model_name='variantimage',
            name='exclude_at_marketplace',
            field=models.BooleanField(default=False, verbose_name='Исключить на площадках'),
        ),
    ]
