# Generated by Django 4.2.4 on 2023-09-06 17:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0029_variantimagethumbnail_exclude'),
    ]

    operations = [
        migrations.RenameField(
            model_name='variantimagethumbnail',
            old_name='exclude',
            new_name='exclude_at_marketplace',
        ),
    ]
