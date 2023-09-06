from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0009_merge_20230822_1931'),
    ]

    operations = [
        migrations.AlterField(
            model_name='homeslidertranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='pagestranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
    ]
