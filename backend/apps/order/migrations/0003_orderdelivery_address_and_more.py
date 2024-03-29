# Generated by Django 4.1.7 on 2023-06-30 20:18

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0002_orderdelivery_comment'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderdelivery',
            name='address',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Адрес'),
        ),
        migrations.AlterField(
            model_name='orderdelivery',
            name='delivery_type',
            field=models.CharField(choices=[('courier', 'Курьером по Киеву'), ('newpost', 'Новая почта'), ('other', 'Другое')], max_length=100, verbose_name='Тип доставки'),
        ),
        migrations.AlterField(
            model_name='orderdeliveryaddress',
            name='delivery',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='address_delivery', to='order.orderdelivery', verbose_name='Доставка'),
        ),
        migrations.AlterField(
            model_name='orderdeliverynewpost',
            name='delivery',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='newpost_delivery', to='order.orderdelivery', verbose_name='Доставка'),
        ),
    ]
