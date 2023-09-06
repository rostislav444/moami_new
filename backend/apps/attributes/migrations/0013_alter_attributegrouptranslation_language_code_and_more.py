from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attributes', '0012_alter_attributegrouptranslation_language_code_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attributegrouptranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='attributetranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
        migrations.AlterField(
            model_name='compositiontranslation',
            name='language_code',
            field=models.CharField(choices=[('uk', 'Ukrainian'), ('en', 'English')], max_length=6),
        ),
    ]
