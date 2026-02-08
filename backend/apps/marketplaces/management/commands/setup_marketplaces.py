"""
Настройка маркетплейсов из существующих шаблонов и конфигураций.

Создаёт:
- Marketplace записи для каждого маркетплейса
- FeedTemplate записи из существующих XML шаблонов

Usage:
    python manage.py setup_marketplaces
    python manage.py setup_marketplaces --marketplace=epicentr
"""

import os
from django.core.management.base import BaseCommand
from django.conf import settings

from apps.marketplaces.models import Marketplace, FeedTemplate


MARKETPLACES_CONFIG = {
    'rozetka': {
        'name': 'Rozetka',
        'integration_type': 'xml_feed',
        'feed_filename': 'rozetka.xml',
        'api_config': {},
        'templates_dir': 'feed/rozetka',
    },
    'modna_kasta': {
        'name': 'ModnaKasta',
        'integration_type': 'both',
        'feed_filename': 'modna_kasta.xml',
        'api_config': {
            'base_url': 'https://api.modnakasta.ua',
            'auth_type': 'token',
            'notes': 'Токен хранится в ModnaKastaTolen модели',
        },
        'templates_dir': 'feed/modna_kasta',
    },
    'epicentr': {
        'name': 'Epicentr',
        'integration_type': 'both',
        'feed_filename': 'epicentr.xml',
        'api_config': {
            'base_url': 'https://api.epicentrm.com.ua',
            'auth_type': 'bearer',
            'endpoints': {
                'categories': '/v2/pim/categories',
                'attribute_sets': '/v2/pim/attribute-sets',
                'options': '/v2/pim/attribute-sets/{set_code}/attributes/{attr_code}/options',
            }
        },
        'templates_dir': 'feed/epicentr',
    },
    'google': {
        'name': 'Google Shopping',
        'integration_type': 'xml_feed',
        'feed_filename': 'google.xml',
        'api_config': {},
        'templates_dir': 'feed/google',
    },
    'leboutique': {
        'name': 'LeBoutique',
        'integration_type': 'xml_feed',
        'feed_filename': 'leboutique.xml',
        'api_config': {},
        'templates_dir': 'feed/leboutique',
    },
}


class Command(BaseCommand):
    help = 'Настройка маркетплейсов из существующих шаблонов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--marketplace',
            type=str,
            help='Создать только указанный маркетплейс',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='Показать список доступных маркетплейсов',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.stdout.write('Доступные маркетплейсы:')
            for slug, config in MARKETPLACES_CONFIG.items():
                self.stdout.write(f'  - {slug}: {config["name"]}')
            return

        target = options['marketplace']

        if target:
            if target not in MARKETPLACES_CONFIG:
                self.stderr.write(f'Неизвестный маркетплейс: {target}')
                self.stderr.write(f'Доступные: {", ".join(MARKETPLACES_CONFIG.keys())}')
                return
            self._setup_marketplace(target, MARKETPLACES_CONFIG[target])
        else:
            for slug, config in MARKETPLACES_CONFIG.items():
                self._setup_marketplace(slug, config)

        self.stdout.write(self.style.SUCCESS('\nНастройка завершена!'))

    def _setup_marketplace(self, slug, config):
        self.stdout.write(f'\n{"="*50}')
        self.stdout.write(f'Настройка {config["name"]}')
        self.stdout.write('='*50)

        # Создаём или получаем маркетплейс
        marketplace, created = Marketplace.objects.update_or_create(
            slug=slug,
            defaults={
                'name': config['name'],
                'integration_type': config['integration_type'],
                'api_config': config.get('api_config', {}),
                'feed_filename': config.get('feed_filename', ''),
                'feed_template': config.get('templates_dir', ''),
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'  Создан маркетплейс: {config["name"]}'))
        else:
            self.stdout.write(f'  Обновлён маркетплейс: {config["name"]}')

        # Загружаем шаблоны
        templates_dir = config.get('templates_dir')
        single_template = config.get('single_template')

        if templates_dir:  # Не пустая строка
            self._load_templates_from_dir(marketplace, templates_dir)
        if single_template:
            self._load_single_template(marketplace, single_template)

    def _load_templates_from_dir(self, marketplace, templates_dir):
        """Загрузить шаблоны из директории"""
        base_path = os.path.join(settings.BASE_DIR, 'templates', templates_dir)

        if not os.path.exists(base_path):
            self.stdout.write(self.style.WARNING(f'  Директория не найдена: {base_path}'))
            return

        template_mapping = {
            'feed.xml': 'header',
            'product.xml': 'product',
            'categories.xml': 'footer',  # Категории идут в footer для Rozetka/MK
        }

        # Проверяем структуру - если есть feed.xml который включает categories и products,
        # то это header, а categories.xml - это отдельный блок
        feed_path = os.path.join(base_path, 'feed.xml')
        if os.path.exists(feed_path):
            with open(feed_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Если feed.xml содержит {{ categories_xml }} и {{ products_xml }},
                # значит это шаблон-обёртка (header)
                if '{{ categories_xml' in content or '{{ products_xml' in content:
                    template_mapping['feed.xml'] = 'header'

        for filename, template_type in template_mapping.items():
            file_path = os.path.join(base_path, filename)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Определяем правильный тип
                if filename == 'feed.xml':
                    template_type = 'header'
                elif filename == 'product.xml':
                    template_type = 'product'
                elif filename == 'categories.xml':
                    # categories.xml - это отдельный блок для категорий
                    template_type = 'footer'

                template, created = FeedTemplate.objects.update_or_create(
                    marketplace=marketplace,
                    template_type=template_type,
                    defaults={
                        'name': f'{marketplace.name} - {template_type}',
                        'content': content,
                        'is_active': True,
                    }
                )

                action = 'Создан' if created else 'Обновлён'
                self.stdout.write(f'  {action} шаблон: {template_type} ({filename})')

    def _load_single_template(self, marketplace, template_path):
        """Загрузить один шаблон (для Facebook)"""
        file_path = os.path.join(settings.BASE_DIR, 'templates', template_path)

        if not os.path.exists(file_path):
            self.stdout.write(self.style.WARNING(f'  Файл не найден: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Для одиночного файла создаём как header (содержит всё)
        template, created = FeedTemplate.objects.update_or_create(
            marketplace=marketplace,
            template_type='header',
            defaults={
                'name': f'{marketplace.name} - полный шаблон',
                'content': content,
                'is_active': True,
            }
        )

        action = 'Создан' if created else 'Обновлён'
        self.stdout.write(f'  {action} шаблон: header ({template_path})')
