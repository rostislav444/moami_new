from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0027_alter_productvideo_product'),
    ]

    operations = [
        migrations.AlterField(
            model_name='brandtranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='colortranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='countrytranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='producttranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
    ]
