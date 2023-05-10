from django.core.management.base import BaseCommand

from apps.sizes.abstract._createinitialdata import CreateInitialSizesAbstract


class Command(CreateInitialSizesAbstract, BaseCommand):
    def handle(self, *args, **options):
        self.stdout.write('Creating initial sizes...')
        self.create_initial_sizes()
        self.stdout.write('Done.')
