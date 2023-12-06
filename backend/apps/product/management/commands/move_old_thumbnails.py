from django.core.management.base import BaseCommand

from apps.product.models import VariantImage


class Command(BaseCommand):
    def handle(self, *args, **options):
        ids = []
        count = VariantImage.objects.count()
        for image in VariantImage.objects.all():
            try:
                image.save()
            except:
                ids.append(image.id)
                print(len(ids) / count * 100)
                continue

        VariantImage.objects.filter(id__in=ids).delete()

        self.stdout.write(self.style.SUCCESS('Successfully moved thumbs'))

