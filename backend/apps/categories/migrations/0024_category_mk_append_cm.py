from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0023_category_epicentr_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='mk_append_cm',
            field=models.BooleanField(default=False, verbose_name='Добавлять суффикс "см" в MK фиде'),
        ),
    ]
