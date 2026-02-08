"""
Миграция данных из старых интеграций в новую универсальную систему.

Мигрирует:
- RozetkaCategories → MarketplaceCategory
- GoogleTaxonomy → MarketplaceCategory
- FacebookCategories → MarketplaceCategory
- ModnaKastaCategories → MarketplaceCategory
- EpicentrCategories → MarketplaceCategory
- EpicentrAttributeSet → MarketplaceAttributeSet
- EpicentrAttribute → MarketplaceAttribute
- EpicentrAttributeOption → MarketplaceAttributeOption
- EpicentrProductAttribute → ProductMarketplaceAttribute

Usage:
    python manage.py migrate_legacy_integrations
    python manage.py migrate_legacy_integrations --marketplace=epicentr
    python manage.py migrate_legacy_integrations --dry-run
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceCategory,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
    ProductMarketplaceConfig,
    ProductMarketplaceAttribute,
)


class Command(BaseCommand):
    help = 'Миграция данных из старых интеграций в новую универсальную систему'

    def add_arguments(self, parser):
        parser.add_argument(
            '--marketplace',
            type=str,
            help='Мигрировать только указанный маркетплейс (epicentr, rozetka, google, facebook, modnakasta)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет сделано без реальных изменений',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить существующие данные перед миграцией',
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        self.verbosity = options['verbosity']
        target = options['marketplace']

        if options['clear'] and not self.dry_run:
            self.stdout.write('Очистка существующих данных...')
            ProductMarketplaceAttribute.objects.all().delete()
            ProductMarketplaceConfig.objects.all().delete()
            MarketplaceAttributeOption.objects.all().delete()
            MarketplaceAttribute.objects.all().delete()
            MarketplaceAttributeSet.objects.all().delete()
            MarketplaceCategory.objects.all().delete()
            Marketplace.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Данные очищены'))

        marketplaces = {
            'epicentr': self.migrate_epicentr,
            'rozetka': self.migrate_rozetka,
            'google': self.migrate_google,
            'facebook': self.migrate_facebook,
            'modnakasta': self.migrate_modnakasta,
        }

        if target:
            if target not in marketplaces:
                self.stderr.write(f'Неизвестный маркетплейс: {target}')
                return
            marketplaces[target]()
        else:
            for name, func in marketplaces.items():
                self.stdout.write(f'\n{"="*50}')
                self.stdout.write(f'Миграция {name.upper()}')
                self.stdout.write('='*50)
                func()

        self.stdout.write(self.style.SUCCESS('\nМиграция завершена!'))

    def get_or_create_marketplace(self, slug, name, integration_type='xml_feed', api_config=None):
        """Создать или получить маркетплейс"""
        if self.dry_run:
            self.stdout.write(f'[DRY-RUN] Создание маркетплейса: {name}')
            return None, True

        marketplace, created = Marketplace.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'integration_type': integration_type,
                'api_config': api_config or {},
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Создан маркетплейс: {name}'))
        else:
            self.stdout.write(f'Маркетплейс уже существует: {name}')
        return marketplace, created

    def migrate_epicentr(self):
        """Миграция Epicentr"""
        try:
            from apps.integrations.models.models_epicentr import (
                EpicentrCategories,
                EpicentrAttributeSet,
                EpicentrAttribute,
                EpicentrAttributeOption,
                EpicentrProductAttribute,
            )
        except ImportError:
            self.stdout.write(self.style.WARNING('Модели Epicentr не найдены'))
            return

        if not self._table_exists('integrations_epicentrcategories'):
            self.stdout.write(self.style.WARNING('Таблица integrations_epicentrcategories не существует'))
            return

        marketplace, _ = self.get_or_create_marketplace(
            slug='epicentr',
            name='Epicentr',
            integration_type='both',
            api_config={
                'base_url': 'https://api.epicentrm.com.ua',
                'auth_type': 'bearer',
                'endpoints': {
                    'categories': '/v2/pim/categories',
                    'attribute_sets': '/v2/pim/attribute-sets',
                    'options': '/v2/pim/attribute-sets/{set_code}/attributes/{attr_code}/options',
                }
            }
        )

        if self.dry_run:
            cats = EpicentrCategories.objects.count()
            sets = EpicentrAttributeSet.objects.count()
            attrs = EpicentrAttribute.objects.count()
            opts = EpicentrAttributeOption.objects.count()
            prod_attrs = EpicentrProductAttribute.objects.count()
            self.stdout.write(f'[DRY-RUN] Категорий: {cats}, Наборов: {sets}, Атрибутов: {attrs}, Опций: {opts}, Товарных атрибутов: {prod_attrs}')
            return

        # Миграция категорий
        cats_migrated = 0
        for cat in EpicentrCategories.objects.all():
            MarketplaceCategory.objects.get_or_create(
                marketplace=marketplace,
                external_code=cat.code,
                defaults={
                    'external_id': str(cat.id),
                    'name': cat.name,
                    'extra_data': {'attribute_sets': cat.attribute_sets},
                    'has_children': False,
                    'is_active': True,
                }
            )
            cats_migrated += 1
        self.stdout.write(f'  Категорий: {cats_migrated}')

        # Миграция наборов атрибутов и атрибутов
        set_mapping = {}  # old_id -> new_obj
        attr_mapping = {}  # old_id -> new_obj
        option_mapping = {}  # old_id -> new_obj

        sets_migrated = 0
        for old_set in EpicentrAttributeSet.objects.all():
            new_set, _ = MarketplaceAttributeSet.objects.get_or_create(
                marketplace=marketplace,
                external_code=old_set.code,
                defaults={
                    'name': old_set.name,
                    'is_active': True,
                }
            )
            set_mapping[old_set.id] = new_set
            sets_migrated += 1
        self.stdout.write(f'  Наборов атрибутов: {sets_migrated}')

        # Миграция атрибутов
        attrs_migrated = 0
        for old_attr in EpicentrAttribute.objects.select_related('attribute_set').all():
            new_set = set_mapping.get(old_attr.attribute_set_id)
            if not new_set:
                continue

            new_attr, _ = MarketplaceAttribute.objects.get_or_create(
                attribute_set=new_set,
                external_code=old_attr.code,
                defaults={
                    'name': old_attr.name,
                    'attr_type': old_attr.type or 'string',
                    'is_required': old_attr.is_required,
                    'is_system': old_attr.is_system,
                }
            )
            attr_mapping[old_attr.id] = new_attr
            attrs_migrated += 1
        self.stdout.write(f'  Атрибутов: {attrs_migrated}')

        # Миграция опций
        opts_migrated = 0
        for old_opt in EpicentrAttributeOption.objects.select_related('attribute').all():
            new_attr = attr_mapping.get(old_opt.attribute_id)
            if not new_attr:
                continue

            new_opt, _ = MarketplaceAttributeOption.objects.get_or_create(
                attribute=new_attr,
                external_code=old_opt.code,
                defaults={
                    'name': old_opt.name,
                }
            )
            option_mapping[old_opt.id] = new_opt
            opts_migrated += 1
        self.stdout.write(f'  Опций атрибутов: {opts_migrated}')

        # Миграция значений атрибутов товаров
        prod_attrs_migrated = 0
        for old_pa in EpicentrProductAttribute.objects.select_related('attribute', 'value_option').all():
            new_attr = attr_mapping.get(old_pa.attribute_id)
            if not new_attr:
                continue

            # Получить или создать конфиг товара
            config, _ = ProductMarketplaceConfig.objects.get_or_create(
                product_id=old_pa.product_id,
                marketplace=marketplace,
                defaults={'is_active': True}
            )

            new_opt = option_mapping.get(old_pa.value_option_id) if old_pa.value_option_id else None

            new_pa, created = ProductMarketplaceAttribute.objects.get_or_create(
                config=config,
                attribute=new_attr,
                defaults={
                    'value_option': new_opt,
                    'value_string': old_pa.value_string,
                    'value_text': old_pa.value_text,
                    'value_int': old_pa.value_int,
                    'value_float': old_pa.value_float,
                    'value_array': old_pa.value_array or [],
                }
            )

            # Миграция multiselect опций
            if created and old_pa.value_options.exists():
                for old_multi_opt in old_pa.value_options.all():
                    new_multi_opt = option_mapping.get(old_multi_opt.id)
                    if new_multi_opt:
                        new_pa.value_options.add(new_multi_opt)

            prod_attrs_migrated += 1
        self.stdout.write(f'  Значений атрибутов товаров: {prod_attrs_migrated}')

    def _table_exists(self, table_name):
        """Проверить существование таблицы в БД"""
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = '{table_name}'
                )
            """)
            return cursor.fetchone()[0]

    def migrate_rozetka(self):
        """Миграция Rozetka"""
        try:
            from apps.integrations.models.models_rozetka import RozetkaCategories
        except ImportError:
            self.stdout.write(self.style.WARNING('Модели Rozetka не найдены'))
            return

        if not self._table_exists('integrations_rozetkacategories'):
            self.stdout.write(self.style.WARNING('Таблица integrations_rozetkacategories не существует'))
            return

        marketplace, _ = self.get_or_create_marketplace(
            slug='rozetka',
            name='Rozetka',
            integration_type='xml_feed',
        )

        if self.dry_run:
            count = RozetkaCategories.objects.count()
            self.stdout.write(f'[DRY-RUN] Категорий Rozetka: {count}')
            return

        # Миграция категорий (MPTT дерево)
        cats_migrated = 0
        parent_mapping = {}  # old_id -> new_obj

        # Сначала создаём корневые категории
        for old_cat in RozetkaCategories.objects.filter(parent__isnull=True):
            new_cat = self._create_marketplace_category(
                marketplace, old_cat, None, old_cat.rozetka_id
            )
            parent_mapping[old_cat.id] = new_cat
            cats_migrated += 1

        # Потом дочерние по уровням
        for level in range(1, 10):  # максимум 10 уровней вложенности
            level_cats = RozetkaCategories.objects.filter(level=level)
            if not level_cats.exists():
                break

            for old_cat in level_cats:
                parent_new = parent_mapping.get(old_cat.parent_id)
                new_cat = self._create_marketplace_category(
                    marketplace, old_cat, parent_new, old_cat.rozetka_id
                )
                parent_mapping[old_cat.id] = new_cat
                cats_migrated += 1

        self.stdout.write(f'  Категорий: {cats_migrated}')

    def migrate_google(self):
        """Миграция Google Taxonomy"""
        try:
            from apps.integrations.models.models_google import GoogleTaxonomy
        except ImportError:
            self.stdout.write(self.style.WARNING('Модели Google не найдены'))
            return

        if not self._table_exists('integrations_googletaxonomy'):
            self.stdout.write(self.style.WARNING('Таблица integrations_googletaxonomy не существует'))
            return

        marketplace, _ = self.get_or_create_marketplace(
            slug='google',
            name='Google Shopping',
            integration_type='xml_feed',
        )

        if self.dry_run:
            count = GoogleTaxonomy.objects.count()
            self.stdout.write(f'[DRY-RUN] Категорий Google: {count}')
            return

        cats_migrated = 0
        for old_cat in GoogleTaxonomy.objects.all():
            MarketplaceCategory.objects.get_or_create(
                marketplace=marketplace,
                external_id=str(old_cat.id),
                defaults={
                    'external_code': str(old_cat.id),
                    'name': old_cat.name,
                    'name_uk': old_cat.name_ru,
                    'has_children': False,
                    'is_active': True,
                }
            )
            cats_migrated += 1
        self.stdout.write(f'  Категорий: {cats_migrated}')

    def migrate_facebook(self):
        """Миграция Facebook Categories"""
        try:
            from apps.integrations.models.models_facebook import FacebookCategories
        except ImportError:
            self.stdout.write(self.style.WARNING('Модели Facebook не найдены'))
            return

        if not self._table_exists('integrations_facebookcategories'):
            self.stdout.write(self.style.WARNING('Таблица integrations_facebookcategories не существует'))
            return

        marketplace, _ = self.get_or_create_marketplace(
            slug='facebook',
            name='Facebook/Instagram Shop',
            integration_type='xml_feed',
        )

        if self.dry_run:
            count = FacebookCategories.objects.count()
            self.stdout.write(f'[DRY-RUN] Категорий Facebook: {count}')
            return

        cats_migrated = 0
        parent_mapping = {}

        # Корневые
        for old_cat in FacebookCategories.objects.filter(parent__isnull=True):
            new_cat = self._create_marketplace_category(
                marketplace, old_cat, None,
                external_id=old_cat.facebook_id or str(old_cat.id),
                name=old_cat.name,
                extra_data={'full_name': old_cat.full_name}
            )
            parent_mapping[old_cat.id] = new_cat
            cats_migrated += 1

        # Дочерние по уровням
        for level in range(1, 10):
            level_cats = FacebookCategories.objects.filter(level=level)
            if not level_cats.exists():
                break

            for old_cat in level_cats:
                parent_new = parent_mapping.get(old_cat.parent_id)
                new_cat = self._create_marketplace_category(
                    marketplace, old_cat, parent_new,
                    external_id=old_cat.facebook_id or str(old_cat.id),
                    name=old_cat.name,
                    extra_data={'full_name': old_cat.full_name}
                )
                parent_mapping[old_cat.id] = new_cat
                cats_migrated += 1

        self.stdout.write(f'  Категорий: {cats_migrated}')

    def migrate_modnakasta(self):
        """Миграция ModnaKasta"""
        try:
            from apps.integrations.models.models_modnakasta import ModnaKastaCategories
        except ImportError:
            self.stdout.write(self.style.WARNING('Модели ModnaKasta не найдены'))
            return

        if not self._table_exists('integrations_modnakastacategories'):
            self.stdout.write(self.style.WARNING('Таблица integrations_modnakastacategories не существует'))
            return

        marketplace, _ = self.get_or_create_marketplace(
            slug='modna_kasta',
            name='ModnaKasta',
            integration_type='both',  # API + XML feed
        )

        if self.dry_run:
            count = ModnaKastaCategories.objects.count()
            self.stdout.write(f'[DRY-RUN] Категорий ModnaKasta: {count}')
            return

        cats_migrated = 0
        parent_mapping = {}

        # Корневые
        for old_cat in ModnaKastaCategories.objects.filter(parent__isnull=True):
            new_cat = self._create_marketplace_category(
                marketplace, old_cat, None,
                external_id=str(old_cat.id),
                external_code=old_cat.name_alias,
                name=old_cat.name,
                extra_data={
                    'kind_id': old_cat.kind_id,
                    'affiliation_id': old_cat.affiliation_id,
                    'name_alias': old_cat.name_alias,
                }
            )
            parent_mapping[old_cat.id] = new_cat
            cats_migrated += 1

        # Дочерние
        for level in range(1, 10):
            level_cats = ModnaKastaCategories.objects.filter(level=level)
            if not level_cats.exists():
                break

            for old_cat in level_cats:
                parent_new = parent_mapping.get(old_cat.parent_id)
                new_cat = self._create_marketplace_category(
                    marketplace, old_cat, parent_new,
                    external_id=str(old_cat.id),
                    external_code=old_cat.name_alias,
                    name=old_cat.name,
                    extra_data={
                        'kind_id': old_cat.kind_id,
                        'affiliation_id': old_cat.affiliation_id,
                        'name_alias': old_cat.name_alias,
                    }
                )
                parent_mapping[old_cat.id] = new_cat
                cats_migrated += 1

        self.stdout.write(f'  Категорий: {cats_migrated}')

    def _create_marketplace_category(self, marketplace, old_cat, parent_new,
                                     external_id=None, external_code=None, name=None,
                                     extra_data=None):
        """Хелпер для создания категории"""
        has_children = hasattr(old_cat, 'get_children') and old_cat.get_children().exists()

        new_cat, _ = MarketplaceCategory.objects.get_or_create(
            marketplace=marketplace,
            external_id=external_id or str(old_cat.id),
            defaults={
                'external_code': external_code or getattr(old_cat, 'slug', str(old_cat.id)),
                'name': name or old_cat.name,
                'parent': parent_new,
                'has_children': has_children,
                'extra_data': extra_data or {},
                'is_active': True,
            }
        )

        # Обновить has_children у родителя
        if parent_new and not parent_new.has_children:
            parent_new.has_children = True
            parent_new.save(update_fields=['has_children'])

        return new_cat
