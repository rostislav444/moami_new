# Generated by Django 4.2.4 on 2023-08-30 19:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0026_alter_productvideo_product_alter_productvideo_video'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productvideo',
            name='product',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='video', to='product.product'),
        ),
    ]
