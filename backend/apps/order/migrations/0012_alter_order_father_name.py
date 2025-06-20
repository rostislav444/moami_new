# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0011_alter_orderdeliveryaddress_city'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='father_name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Отчество'),
        ),
    ] 