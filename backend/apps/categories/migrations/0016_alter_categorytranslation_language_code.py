from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0015_category_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='categorytranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
    ]
