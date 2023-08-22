import json
from decimal import Decimal

import requests
from django.core.management.base import BaseCommand

from apps.newpost.models import NewPostApiKey, NewPostAreas, NewPostCities, NewPostDepartments, NewPostRegion


# class Command(BaseCommand):
#     endpoint = 'https://api.novaposhta.ua/v2.0/json/'
#     api_key = NewPostApiKey.objects.first()
#
#     def response(self, data):
#         data = json.dumps(data)
#         response = requests.post(self.endpoint, data)
#         response = response.json()
#         return response
#
#     def load_areas(self):
#         data = self.response({
#             "apiKey": self.api_key.value,
#             "modelName": "Address",
#             "calledMethod": "getAreas",
#             "methodProperties": {}
#         })
#
#         for state in data['data']:
#             print(state)
#             state_item, _ = NewPostAreas.objects.get_or_create(
#                 ref=state['Ref'],
#                 areas_center=state['AreasCenter'],
#                 description_ru=state['DescriptionRu'],
#                 description=state['Description']
#             )
#             print(state_item)
#
#     def load_region(self, area, item):
#         if not item['Region']:
#             return None
#         keys = {
#             'region': "Region",
#             'description': "RegionsDescription",
#             'description_ru': "RegionsDescriptionRu",
#             'description_translit': "RegionsDescriptionTranslit"
#         }
#         data = {k: item[v] for k, v in keys.items()}
#         data['area'] = area
#         region, _ = NewPostRegion.objects.get_or_create(**data)
#         return region
#
#     def load_cities(self):
#         total_count = None
#         limit = 200
#
#         NewPostRegion.objects.all().delete()
#         NewPostCities.objects.all().delete()
#
#         def get_request_data(page):
#             return {
#                 "apiKey": self.api_key.value,
#                 "modelName": "Address",
#                 "calledMethod": "getSettlements",
#                 "methodProperties": {
#                     "Page": str(page),
#                     "Limit": str(limit),
#                 }
#             }
#
#         def iter_data(data_list, page):
#             for item in data_list:
#                 area = NewPostAreas.objects.get(description=item["AreaDescription"].split(' ')[0])
#                 region = self.load_region(area, item)
#                 city, _ = NewPostCities.objects.get_or_create(
#                     region=region,
#                     area=area,
#                     ref=item['Ref'],
#                     settlement_type=item['SettlementType'],
#                     latitude=Decimal(item['Latitude']),
#                     longitude=Decimal(item['Longitude']),
#                     description=item['Description'],
#                     description_ru=item['DescriptionRu'],
#                     description_translit=item['DescriptionTranslit'],
#                     settlement_type_description=item['SettlementTypeDescription'],
#                     settlement_type_description_ru=item['SettlementTypeDescriptionRu'],
#                     settlement_type_description_translit=item['SettlementTypeDescriptionTranslit'],
#                     warehouse=bool(item['Warehouse'])
#                 )
#                 print(city)
#
#             if NewPostCities.objects.count() < total_count:
#                 page += 1
#                 print('Cities', NewPostCities.objects.count(), 'of', total_count)
#                 new_response = self.response(get_request_data(page))
#                 iter_data(new_response['data'], page)
#
#         if not total_count:
#             page = int(NewPostCities.objects.count() / limit)
#             response = self.response(get_request_data(page))
#
#             if not response['success']:
#                 raise Exception(response['errors'])
#
#             total_count = response['info']['totalCount']
#             iter_data(response['data'], page)
#
#     def load_departments(self):
#         total_count = None
#         limit = 100
#         prev_count = 0
#
#         # NewPostDepartments.objects.all().delete()
#
#         def get_request_data(page):
#             return {
#                 "apiKey": self.api_key.value,
#                 "modelName": "Address",
#                 "calledMethod": "getWarehouses",
#                 "methodProperties": {
#                     "Page": str(page),
#                     "Limit": str(limit),
#                     "Language": "UA",
#                     # "TypeOfWarehouseRef": "9a68df70-0267-42a8-bb5c-37f427e36ee4"
#                 }
#             }
#
#         def iter_data(data_list, page=1):
#             for item in data_list:
#                 try:
#                     city = NewPostCities.objects.get(ref=item['SettlementRef'])
#                 except NewPostCities.DoesNotExist:
#                     print('City not found', item['SettlementRef'])
#                     continue
#                 department, _ = NewPostDepartments.objects.get_or_create(
#                     city=city,
#                     ref=item['Ref'],
#                     number=item['Number'],
#                     site_key=item['SiteKey'],
#                     description=item['Description'],
#                     description_ru=item['DescriptionRu'],
#                     short_address=item['ShortAddress'],
#                     short_address_ru=item['ShortAddressRu'],
#                     phone=item['Phone'],
#                     latitude=item['Latitude'],
#                     longitude=item['Longitude'],
#                     schedule=item['Schedule'],
#                     receiving_limitations_on_dimensions=item['ReceivingLimitationsOnDimensions'],
#                     place_max_weight_allowed=item['PlaceMaxWeightAllowed'],
#                     warehouse_status=item['WarehouseStatus'],
#                     warehouse_index=item['WarehouseIndex'],
#                 )
#                 print(department)
#             count = NewPostDepartments.objects.count()
#             if count < total_count - 1:
#                 page += 1
#                 print('page', page)
#                 print('Departments', count, ' of ', total_count)
#                 new_response = self.response(get_request_data(page))
#                 iter_data(new_response['data'], page)
#
#         if not total_count:
#             init_page = int(NewPostDepartments.objects.count() / 100)
#             if init_page == 0:
#                 init_page = 1
#             response = self.response(get_request_data(1))
#             total_count = response['info']['totalCount']
#             print('Total:', total_count)
#             print(response['data'])
#             iter_data(response['data'], init_page)
#
#     def handle(self, *args, **options):
#         self.load_areas()
#         self.load_cities()
#         self.load_departments()


class Command(BaseCommand):
    endpoint = 'https://api.novaposhta.ua/v2.0/json/'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = NewPostApiKey.objects.first().value

    def post_request(self, method, properties=None):
        """
        Send a post request and return the data.
        """
        data = {
            "apiKey": self.api_key,
            "modelName": "Address",
            "calledMethod": method,
            "methodProperties": properties if properties else {}
        }
        response = requests.post(self.endpoint, json=data)
        return response.json()

    def load_areas(self):
        """
        Load and save areas data.
        """
        data = self.post_request("getAreas")
        for state in data['data']:
            NewPostAreas.objects.get_or_create(
                ref=state['Ref'],
                areas_center=state['AreasCenter'],
                description_ru=state['DescriptionRu'],
                description=state['Description']
            )

    def load_region(self, area, item):
        """
        Load and save region data.
        """
        if not item['Region']:
            return None
        keys = {
            'region': "Region",
            'description': "RegionsDescription",
            'description_ru': "RegionsDescriptionRu",
            'description_translit': "RegionsDescriptionTranslit"
        }
        data = {k: item[v] for k, v in keys.items()}
        data['area'] = area
        region, _ = NewPostRegion.objects.get_or_create(**data)
        return region

    def fetch_cities(self, page=1, limit=200):
        """
        Fetch cities recursively.
        """
        response = self.post_request("getSettlements", {"Page": str(page), "Limit": str(limit)})
        if not response['success']:
            raise Exception(response['errors'])

        total_count = response['info']['totalCount']

        for item in response['data']:
            area = NewPostAreas.objects.get(description=item["AreaDescription"].split(' ')[0])
            region = self.load_region(area, item)
            print(item['DescriptionRu'])
            NewPostCities.objects.get_or_create(
                region=region,
                area=area,
                ref=item['Ref'],
                settlement_type=item['SettlementType'],
                latitude=Decimal(item['Latitude']),
                longitude=Decimal(item['Longitude']),
                description=item['Description'],
                description_ru=item['DescriptionRu'],
                description_translit=item['DescriptionTranslit'],
                settlement_type_description=item['SettlementTypeDescription'],
                settlement_type_description_ru=item['SettlementTypeDescriptionRu'],
                settlement_type_description_translit=item['SettlementTypeDescriptionTranslit'],
                warehouse=bool(item['Warehouse'])
            )

        fetched_count = NewPostCities.objects.count()
        if fetched_count < total_count:
            self.fetch_cities(page=page + 1)

    def load_cities(self):
        """
        Initiate the cities data load.
        """
        NewPostRegion.objects.all().delete()
        NewPostCities.objects.all().delete()
        self.fetch_cities()

    def load_departments(self, page=1, limit=100):
        """
        Fetch departments recursively.
        """
        properties = {
            "Page": str(page),
            "Limit": str(limit),
            "Language": "UA"
            # "TypeOfWarehouseRef": "9a68df70-0267-42a8-bb5c-37f427e36ee4"
        }

        response = self.post_request("getWarehouses", properties)
        if not response['success']:
            raise Exception(response['errors'])

        total_count = response['info']['totalCount']

        for item in response['data']:
            try:
                city = NewPostCities.objects.get(ref=item['SettlementRef'])
            except NewPostCities.DoesNotExist:
                print('City not found', item['SettlementRef'])
                continue
            print(item['DescriptionRu'])
            NewPostDepartments.objects.get_or_create(
                city=city,
                ref=item['Ref'],
                number=item['Number'],
                site_key=item['SiteKey'],
                description=item['Description'],
                description_ru=item['DescriptionRu'],
                short_address=item['ShortAddress'],
                short_address_ru=item['ShortAddressRu'],
                phone=item['Phone'],
                latitude=item['Latitude'],
                longitude=item['Longitude'],
                schedule=item['Schedule'],
                receiving_limitations_on_dimensions=item['ReceivingLimitationsOnDimensions'],
                place_max_weight_allowed=item['PlaceMaxWeightAllowed'],
                warehouse_status=item['WarehouseStatus'],
                warehouse_index=item['WarehouseIndex'],
            )

        fetched_count = NewPostDepartments.objects.count()
        if fetched_count < total_count:
            self.load_departments(page=page + 1)

    def handle(self, *args, **options):
        """
        Main handler for management command.
        """
        # self.load_areas()
        # self.load_cities()
        self.load_departments()
