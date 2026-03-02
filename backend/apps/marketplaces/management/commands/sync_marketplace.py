from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.marketplaces.models import Marketplace, MarketplaceAttribute
from apps.marketplaces.services import get_marketplace_client


class Command(BaseCommand):
    help = '''
    Синхронизация данных маркетплейса из внешнего API.

    Примеры использования:
        # Синхронизировать всё для Epicentr
        python manage.py sync_marketplace epicentr --all

        # Только категории
        python manage.py sync_marketplace epicentr --categories

        # Атрибуты для конкретных категорий
        python manage.py sync_marketplace epicentr --attributes --category-codes 6390 5414

        # Опции для select/multiselect атрибутов
        python manage.py sync_marketplace epicentr --options --category-codes 6390

        # Сущности (бренды, страны)
        python manage.py sync_marketplace epicentr --entities brand
    '''

    def add_arguments(self, parser):
        parser.add_argument(
            'marketplace',
            type=str,
            help='Slug маркетплейса (например: epicentr)'
        )
        parser.add_argument(
            '--categories',
            action='store_true',
            help='Синхронизировать категории'
        )
        parser.add_argument(
            '--attributes',
            action='store_true',
            help='Синхронизировать наборы атрибутов'
        )
        parser.add_argument(
            '--options',
            action='store_true',
            help='Синхронизировать опции атрибутов (для select/multiselect)'
        )
        parser.add_argument(
            '--entities',
            type=str,
            nargs='*',
            choices=['brand', 'country', 'color', 'measure'],
            help='Синхронизировать сущности указанных типов'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Синхронизировать всё (категории, атрибуты, опции)'
        )
        parser.add_argument(
            '--category-codes',
            nargs='+',
            type=str,
            help='Коды категорий для синхронизации атрибутов/опций'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Не сохранять изменения, только показать что будет сделано'
        )

    def handle(self, *args, **options):
        slug = options['marketplace']

        # Найти маркетплейс
        try:
            marketplace = Marketplace.objects.get(slug=slug)
        except Marketplace.DoesNotExist:
            # Попробуем создать маркетплейс с дефолтными настройками
            if slug == 'epicentr':
                marketplace = self._create_epicentr_marketplace()
                self.stdout.write(
                    self.style.SUCCESS(f'Создан маркетплейс: {marketplace.name}')
                )
            else:
                raise CommandError(f'Маркетплейс "{slug}" не найден')

        client = get_marketplace_client(marketplace)
        sync_all = options['all']
        category_codes = options.get('category_codes')

        self.stdout.write(f'Синхронизация маркетплейса: {marketplace.name}')
        self.stdout.write('-' * 50)

        # Синхронизация категорий
        if options['categories'] or sync_all:
            self.stdout.write('Синхронизация категорий...')
            count = client.sync_categories()
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Категории: {count}')
            )

        # Синхронизация атрибутов
        if options['attributes'] or sync_all:
            self.stdout.write('Синхронизация наборов атрибутов...')
            count = client.sync_attribute_sets(category_codes)
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Наборы атрибутов: {count}')
            )

        # Синхронизация опций
        if options['options'] or sync_all:
            self.stdout.write('Синхронизация опций атрибутов...')

            # Получить атрибуты типа select/multiselect
            attrs_query = MarketplaceAttribute.objects.filter(
                attribute_set__marketplace=marketplace,
                attr_type__in=['select', 'multiselect']
            ).select_related('attribute_set')

            if category_codes:
                attrs_query = attrs_query.filter(
                    attribute_set__external_code__in=category_codes
                )

            total_options = 0
            for attr in attrs_query:
                count = client.sync_attribute_options(
                    attr.attribute_set.external_code,
                    attr.external_code
                )
                total_options += count
                if count > 0:
                    self.stdout.write(f'    {attr.name}: {count} опций')

            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Опции: {total_options}')
            )

        # Синхронизация сущностей
        entity_types = options.get('entities')
        if entity_types:
            self.stdout.write('Синхронизация сущностей...')
            for entity_type in entity_types:
                if hasattr(client, 'sync_entities'):
                    count = client.sync_entities(entity_type)
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ {entity_type}: {count}')
                    )

        # Обновить время последней синхронизации
        marketplace.update_last_sync()

        self.stdout.write('-' * 50)
        self.stdout.write(
            self.style.SUCCESS(f'Синхронизация завершена: {timezone.now()}')
        )

    def _create_epicentr_marketplace(self) -> Marketplace:
        """Создать маркетплейс Epicentr с дефолтными настройками"""
        return Marketplace.objects.create(
            name='Epicentr',
            slug='epicentr',
            integration_type='api',
            api_config={
                'base_url': 'https://api.epicentrm.com.ua',
                'auth_type': 'bearer',
                'token': '5a6489d1a5c48c9d174bd31f2a0a8fd0',
                'endpoints': {
                    'categories': '/v2/pim/categories',
                    'attribute_sets': '/v2/pim/attribute-sets',
                }
            },
            feed_template='feed/epicentr/',
            feed_filename='epicentr.xml',
            is_active=True
        )
