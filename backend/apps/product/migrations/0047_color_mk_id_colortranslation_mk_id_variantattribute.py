# Generated by Django 4.2.4 on 2023-11-30 20:19

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attributes', '0014_attribute_mk_id_attributegroup_data_type_and_more'),
        ('product', '0046_remove_variantviews_utm_medium_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='color',
            name='mk_id',
            field=models.CharField(blank=True, max_length=24, null=True),
        ),
        migrations.AddField(
            model_name='colortranslation',
            name='mk_id',
            field=models.CharField(blank=True, max_length=24, null=True),
        ),
        migrations.CreateModel(
            name='VariantAttribute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attribute_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='attributes.attributegroup')),
                ('attributes', models.ManyToManyField(blank=True, to='attributes.attribute')),
                ('variant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='product.variant')),
            ],
            options={
                'verbose_name': 'Атрибут',
                'verbose_name_plural': 'Атрибуты',
                'unique_together': {('variant', 'attribute_group')},
            },
        ),
    ]