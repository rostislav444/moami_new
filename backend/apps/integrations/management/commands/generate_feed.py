from django.core.management.base import BaseCommand

from apps.integrations.utils.generate_mk_feed import generate_mk_feed


class Command(BaseCommand):
    def handle(self, *args, **options):
        # generate_mk_feed(True)
        generate_mk_feed(False)