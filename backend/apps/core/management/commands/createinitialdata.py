from django.core.management.base import BaseCommand

from apps.categories.utils.create_categories import create_categories
from apps.sizes.utils.create_sizes import CreateSizes
from apps.user.models import User


class Command(BaseCommand):
    help = 'Initialize categories and attributes'

    def create_admin_user(self):
        User.objects.all().delete()
        user = User.objects.create_superuser(
            email='admin@admin.com',
            first_name='admin',
        )
        user.set_password('admin')
        user.save()

    def handle(self, *args, **options):
        self.create_admin_user()
        CreateSizes()
        create_categories()
        # self.stdout.write(self.style.SUCCESS('Successfully created categories and products'))