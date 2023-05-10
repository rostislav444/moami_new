from django.core.management.base import BaseCommand

from apps.categories.utils.create_categories import create_categories
from apps.sizes.utils.create_sizes import CreateSizes


class Command(BaseCommand):
    help = 'Initialize categories and attributes'

    def handle(self, *args, **options):
        CreateSizes()
        create_categories()
        self.stdout.write(self.style.SUCCESS('Successfully created categories and products'))