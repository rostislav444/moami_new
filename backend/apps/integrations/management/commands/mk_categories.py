from django.core.management.base import BaseCommand

from apps.integrations.models import ModnaKastaTolen, ModnaKastaCategories
from apps.integrations.utils.modna_kasta import mk_request, get_mk_request_headers
import requests


class Command(BaseCommand):
    def handle(self, *args, **options):
        url = 'https://hub.kasta.ua/api/supplier-content/category/all'
        headers = get_mk_request_headers()
        response = requests.get(url, headers=headers)
        if response.ok:
            data = response.json()

            for group in data['items']:
                if group['affiliation_id'] == 2098:
                    group_item, _ = ModnaKastaCategories.objects.get_or_create(
                        affiliation_id=group['affiliation_id'],
                        name=group['name'],
                        name_alias=group['name_alias']
                    )
                    for category in group['kinds']:
                        category_item, _ = ModnaKastaCategories.objects.get_or_create(
                            affiliation_id=category['affiliation_id'],
                            kind_id=category['kind_id'],
                            name=category['name'],
                            name_alias=category['name_alias']
                        )
                        print(category_item.name_alias)
