import requests
from django.core.management.base import BaseCommand

from apps.attributes.models import Attribute, AttributeInModnaKastaCategory
from apps.categories.models import Category
from apps.integrations.utils.modna_kasta import get_mk_request_headers


class Command(BaseCommand):
    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.url = 'https://hub.modnakasta.ua/api/supplier-content/category/details'
        self.headers = get_mk_request_headers()

    def fetch_mk_category_characteristics(self, mk_category):
        path = '%s?kind_id=%s&affiliation_id=%s' % (self.url, mk_category.kind_id, mk_category.affiliation_id)
        response = requests.get(path, headers=self.headers)

        if response.ok:
            data = response.json()
            return data.get('schema')
        return None

    def loop_category_attribute_groups(self, schema, category):
        for group in schema:
            values = group.get('value_ids')

            if not values or group['type'] == 'size' or group['human_name'].startswith(('Колір', 'Країна')):
                continue

            for value in values:
                attr = Attribute.objects.filter(mk_id=value['id']).first()
                if attr:
                    obj, _ = AttributeInModnaKastaCategory.objects.get_or_create(
                        attribute=attr,
                        mk_category=category.modna_kast_category
                    )

    def handle(self, update=False, *args, **options):
        categories = Category.objects.select_related('modna_kast_category').filter(modna_kast_category__isnull=False)
        for category in categories:
            mk_category = category.modna_kast_category
            schema = self.fetch_mk_category_characteristics(mk_category)

            if schema:
                self.loop_category_attribute_groups(schema, category)
