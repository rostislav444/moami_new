from django.core.management.base import BaseCommand

from apps.categories.models import Category


class Command(BaseCommand):
    help = 'Resave categories'

    def handle(self, *args, **options):
        for category in Category.objects.all():
            print(category)
            category.ordering = 0
            category.save()
        Category.objects.rebuild()

