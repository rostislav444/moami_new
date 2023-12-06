from django.core.management.base import BaseCommand

from apps.product.models import VariantImage


class Command(BaseCommand):
    def handle(self, *args, **options):
        for image in VariantImage.objects.all():
            try:
                image.create_thumbnails()
            except:
                continue
            print(image.thumbnails)

        self.stdout.write(self.style.SUCCESS('Successfully moved thumbs'))

