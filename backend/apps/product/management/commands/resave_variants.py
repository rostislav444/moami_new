from django.core.management.base import BaseCommand

from apps.product.models import Variant


class Command(BaseCommand):
    def handle(self, *args, **options):
        for variant in Variant.objects.all():
            variant.save()
            n = 0
            for image in variant.images.all():
                image.index = n
                image.save()
                n += 1

        self.stdout.write(self.style.SUCCESS('Successfully resaved variants'))

