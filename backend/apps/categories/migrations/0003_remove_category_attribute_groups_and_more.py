# Generated by Django 4.1.7 on 2023-04-29 16:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attributes', '0006_alter_attribute_slug_alter_attributegroup_slug'),
        ('categories', '0002_alter_category_slug'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='category',
            name='attribute_groups',
        ),
        migrations.CreateModel(
            name='CategoryAttributeGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attribute_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories', to='attributes.attributegroup')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attribute_groups', to='categories.category')),
            ],
            options={
                'verbose_name': 'Attribute group',
                'verbose_name_plural': 'Attribute groups',
                'unique_together': {('category', 'attribute_group')},
            },
        ),
    ]
