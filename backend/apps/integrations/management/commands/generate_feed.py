from django.core.management.base import BaseCommand

from apps.integrations.utils.generate_mk_feed import generate_feed, feed_types


class Command(BaseCommand):
    def handle(self, *args, **options):
        for feed_type in feed_types:
            print('>>>> Start generating %s <<<<' % feed_type)
            generate_feed(feed_type)
