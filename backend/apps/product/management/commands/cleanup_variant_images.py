import os

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.product.models import VariantImage


class Command(BaseCommand):
    help = 'Delete VariantImage objects whose image file is missing from media'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Only report missing files without deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        images = VariantImage.objects.select_related('variant__product').all()
        total = images.count()

        if total == 0:
            self.stdout.write('No VariantImage objects found.')
            return

        self.stdout.write(f'Total VariantImage objects: {total}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — nothing will be deleted'))

        deleted_count = 0
        checked_count = 0
        last_percent = -1

        for image in images.iterator():
            checked_count += 1

            # Progress logging every 1%
            percent = int(checked_count / total * 100)
            if percent != last_percent:
                last_percent = percent
                self.stdout.write(f'[{percent}%] Checked {checked_count}/{total}, deleted {deleted_count}')

            if not image.image or not image.image.name:
                self.stdout.write(self.style.WARNING(
                    f'  Empty image field: VariantImage id={image.id} ({image})'
                ))
                if not dry_run:
                    image.delete()
                deleted_count += 1
                continue

            file_path = os.path.join(settings.MEDIA_ROOT, image.image.name)
            if not os.path.isfile(file_path):
                self.stdout.write(self.style.WARNING(
                    f'  Missing file: {image.image.name} (VariantImage id={image.id})'
                ))
                if not dry_run:
                    image.delete()
                deleted_count += 1

        self.stdout.write('')
        self.stdout.write(f'Done. Checked: {total}, Deleted: {deleted_count}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no objects were actually deleted'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully cleaned up {deleted_count} orphaned VariantImage objects'))
