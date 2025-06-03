from django.core.management.base import BaseCommand

from project.settings import LANGUAGES
from apps.product.models import Product


class Command(BaseCommand):
    def handle(self, *args, **options):
        count = len(LANGUAGES)
        for product in Product.objects.all():
            if product.translations.count() > count - 1:
                for lang in LANGUAGES:
                    if lang[0] != 'ru':
                        product.translations.filter(language_code=lang[0]).first().delete()
                        print('deleted', product.id, lang[0])
                product.save()
        self.stdout.write(self.style.SUCCESS('Successfully removed translations'))