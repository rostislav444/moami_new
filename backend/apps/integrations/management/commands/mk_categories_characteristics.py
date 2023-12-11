import requests
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import models

from apps.attributes.models import AttributeGroup, Attribute
from apps.categories.models import Category, CategoryAttributeGroup
from apps.integrations.utils.modna_kasta import get_mk_request_headers
from apps.product.models import Color


class Command(BaseCommand):
    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.url = 'https://hub.modnakasta.ua/api/supplier-content/category/details'
        self.headers = get_mk_request_headers()

    @staticmethod
    def create_attribute_groups_attributes(values, attr_group):
        for val in values:
            try:
                Attribute.objects.get(attribute_group=attr_group, name=val['value'], mk_id=val['id'])
            except models.ObjectDoesNotExist:
                attr = Attribute(attribute_group=attr_group, name=val['value'], mk_id=val['id'])
                try:
                    attr.save()
                except:
                    continue

    @staticmethod
    def get_schema_values(schema):
        for items_key in ['value_ids', 'sizecharts']:
            value_ids = schema.get(items_key)
            if not value_ids:
                continue
            if items_key == 'sizecharts':
                value_ids = value_ids[0]['sizes']
            return value_ids
        return None

    @staticmethod
    def assign_mk_ids_to_sizes(category, values):
        size_group = category.size_group
        if size_group:
            for value in values:
                size_group.sizes.filter(
                    interpretations__value=str(value['value']),
                    interpretations__grid__name='ua'
                ).update(mk_id=value['id'])

    @staticmethod
    def assign_mk_id_to_color(values):
        color_translation_model = apps.get_model(app_label='product', model_name='ColorTranslation')

        for value in values:
            color = Color.objects.filter(translations__name=value['value'], translations__language_code='uk').first()
            if color:
                if not color.mk_id:
                    color.mk_id = value['id']
                    color.save()
            else:
                color = Color(name=value['value'], mk_id=value['id'])
                color.save()

                # Create ukrainian translation, as data from MK goes in ukrainian language, but default language of
                # site is RU
                translation_data = {'parent': color, 'name': value['value'], "language_code": 'uk'}
                try:
                    color_translation_model.objects.get(**translation_data)
                except models.ObjectDoesNotExist:
                    color_translation = color_translation_model(**translation_data)
                    color_translation.save()

    @staticmethod
    def get_data_type(group):
        requirements = group['requirements']

        if requirements.get('number?'):
            return AttributeGroup.ATTR_TYPE_CHOICES[2][0]
        if requirements.get('sting?'):
            return AttributeGroup.ATTR_TYPE_CHOICES[3][0]
        if requirements.get('multi?'):
            return AttributeGroup.ATTR_TYPE_CHOICES[0][0]
        if not requirements.get('multi?'):
            return AttributeGroup.ATTR_TYPE_CHOICES[1][0]

        return AttributeGroup.ATTR_TYPE_CHOICES[0][0]

    def create_attribute_groups(self, schema, category):
        for group in schema:
            required = group['requirements'].get('required?')
            values = self.get_schema_values(group)

            if group['type'] == 'size':
                if values:
                    self.assign_mk_ids_to_sizes(category, values)
                continue
            elif group['human_name'].startswith('Колір'):
                self.assign_mk_id_to_color(values)
                continue
            elif group['human_name'].startswith('Країна'):
                continue

            try:
                attr_group = AttributeGroup.objects.get(name=group['human_name'], mk_key_name=group['key_name'],
                                                    mk_type=group['type'])
            except AttributeGroup.ObjectDoesNotExist:
                attr_group = AttributeGroup(
                    name=group['human_name'],
                    mk_key_name=group['key_name'],
                    mk_type=group['type'],
                    data_type=self.get_data_type(group)
                )
                attr_group.save()

            category_attr_group, _ = CategoryAttributeGroup.objects.get_or_create(
                category=category,
                attribute_group=attr_group,
                required=bool(required),
            )

            if values is None:
                print('NO ATTRS', group['human_name'])
                continue

            self.create_attribute_groups_attributes(values, attr_group)

    def fetch_mk_category_characteristics(self, mk_category):
        path = '%s?kind_id=%s&affiliation_id=%s' % (self.url, mk_category.kind_id, mk_category.affiliation_id)
        response = requests.get(path, headers=self.headers)

        if response.ok:
            data = response.json()
            return data.get('schema')
        return None

    def handle(self, *args, **options):
        print('start')
        categories = Category.objects.select_related('modna_kast_category').filter(modna_kast_category__isnull=False)
        for category in categories:
            mk_category = category.modna_kast_category
            schema = self.fetch_mk_category_characteristics(mk_category)

            if schema:
                self.create_attribute_groups(schema, category)
        print('end')
