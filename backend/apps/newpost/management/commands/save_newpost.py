import json

from django.core.management.base import BaseCommand

from apps.newpost.models import NewPostAreas
from apps.newpost.serializer import NewPostAreasRel

import os


class Command(BaseCommand):
    def handle(self, *args, **options):
        areas = NewPostAreas.objects.all().prefetch_related('cities_set')
        areas_serialized = NewPostAreasRel(areas, many=True).data

        # Save to json file data/newpost/data.json and create folder data/newpost if not exists using os
        if not os.path.exists('data/newpost'):
            os.makedirs('data/newpost')

        with open('data/newpost/data.json', 'w', encoding='utf-8') as file:
            json.dump(areas_serialized, file, ensure_ascii=False, indent=4)
