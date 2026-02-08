"""
Импорт атрибутов категорий Розетки из TSV файла.

Формат файла (экспорт из Excel):
- Первая строка: название категории
- Вторая строка: заголовки
- Остальные строки: данные атрибутов

Колонки:
ID параметра | Название параметра | Тип параметра | Тип фильтра |
Единица измерения | ID значения | Название значения | Сквозной параметр

Usage:
    python manage.py import_rozetka_attributes path/to/file.txt
    python manage.py import_rozetka_attributes path/to/file.txt --category-code=4637175
    python manage.py import_rozetka_attributes path/to/file.txt --dry-run
"""

import csv
from collections import defaultdict
from django.core.management.base import BaseCommand

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceCategory,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption
)


# Маппинг типов Розетки на наши типы
TYPE_MAPPING = {
    'ComboBox': 'select',
    'ListValues': 'multiselect',
    'List': 'multiselect',
    'CheckBoxGroupValues': 'multiselect',
    'TextInput': 'string',
    'TextArea': 'text',
    'MultiText': 'text',
    'Integer': 'int',
    'Decimal': 'float',
    'CheckBox': 'string',  # да/нет
}


class Command(BaseCommand):
    help = 'Импорт атрибутов категорий Розетки из TSV файла'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Путь к файлу с атрибутами')
        parser.add_argument(
            '--category-code',
            type=str,
            help='Код категории в Розетке (если не указан, ищется по названию)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет импортировано без сохранения'
        )

    def handle(self, *args, **options):
        file_path = options['file_path']
        category_code = options.get('category_code')
        dry_run = options['dry_run']

        # Получаем маркетплейс Rozetka
        try:
            marketplace = Marketplace.objects.get(slug='rozetka')
        except Marketplace.DoesNotExist:
            self.stderr.write('Маркетплейс Rozetka не найден. Сначала выполните setup_marketplaces.')
            return

        # Читаем файл
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        if len(lines) < 3:
            self.stderr.write('Файл слишком короткий')
            return

        # Первая строка - название категории
        category_name = lines[0].strip().split('\t')[0]
        self.stdout.write(f'Категория: {category_name}')

        # Пропускаем заголовки (строка 2)
        # Парсим данные
        attributes_data = defaultdict(lambda: {
            'name': '',
            'type': '',
            'original_type': '',  # Оригинальный тип Розетки (ComboBox, ListValues, etc.)
            'filter_type': '',
            'unit': '',
            'is_system': False,
            'options': []  # [(id, name), ...]
        })

        for line in lines[2:]:
            parts = line.strip().split('\t')
            if len(parts) < 7:
                continue

            param_id = parts[0].strip()
            param_name = parts[1].strip()
            param_type = parts[2].strip()
            filter_type = parts[3].strip()
            unit = parts[4].strip()
            value_id = parts[5].strip()
            value_name = parts[6].strip()
            is_system = parts[7].strip().lower() == 'да' if len(parts) > 7 else False

            if not param_id or param_id == 'ID параметра':
                continue

            attr = attributes_data[param_id]
            attr['name'] = param_name
            attr['original_type'] = param_type  # Сохраняем оригинальный тип Розетки
            attr['type'] = TYPE_MAPPING.get(param_type, 'string')
            attr['filter_type'] = filter_type
            attr['unit'] = unit if unit != 'N/D' else ''
            attr['is_system'] = is_system

            # Добавляем опцию если есть
            if value_id and value_name:
                attr['options'].append((value_id, value_name))

        self.stdout.write(f'Найдено атрибутов: {len(attributes_data)}')

        if dry_run:
            self.stdout.write('\n=== DRY RUN ===')
            for param_id, attr in sorted(attributes_data.items(), key=lambda x: x[1]['name']):
                opts_count = len(attr['options'])
                orig_type = attr['original_type']
                our_type = attr['type']
                self.stdout.write(
                    f"  [{param_id}] {attr['name']} | {orig_type} → {our_type} | {opts_count} опций"
                )
            return

        # Ищем категорию
        if category_code:
            category = MarketplaceCategory.objects.filter(
                marketplace=marketplace,
                external_code=category_code
            ).first()
        else:
            category = MarketplaceCategory.objects.filter(
                marketplace=marketplace,
                name__icontains=category_name
            ).first()

        if not category:
            self.stdout.write(self.style.WARNING(
                f'Категория "{category_name}" не найдена в БД. Создаю набор атрибутов с кодом "{category_code or category_name}"'
            ))
            external_code = category_code or category_name.lower().replace(' ', '_')
        else:
            external_code = category.external_code
            self.stdout.write(f'Найдена категория: {category.name} (код: {external_code})')

        # Создаём набор атрибутов
        attr_set, created = MarketplaceAttributeSet.objects.get_or_create(
            marketplace=marketplace,
            external_code=external_code,
            defaults={
                'name': category_name,
                'name_uk': category_name,
                'marketplace_category': category,  # Связь с категорией
            }
        )
        action = 'Создан' if created else 'Обновлён'
        self.stdout.write(f'{action} набор атрибутов: {attr_set.name}')

        # Создаём атрибуты
        created_attrs = 0
        created_opts = 0

        for param_id, attr_data in attributes_data.items():
            attr, attr_created = MarketplaceAttribute.objects.update_or_create(
                attribute_set=attr_set,
                external_code=param_id,
                defaults={
                    'name': attr_data['name'],
                    'name_uk': attr_data['name'],
                    'attr_type': attr_data['type'],
                    'is_required': attr_data['filter_type'] != 'disable',
                    'is_system': attr_data['is_system'],
                    'suffix': attr_data['unit'] or '',
                    'extra_data': {
                        'original_type': attr_data['original_type'],
                        'filter_type': attr_data['filter_type'],
                    },
                }
            )

            if attr_created:
                created_attrs += 1

            # Создаём опции (для select/multiselect)
            if attr_data['type'] in ['select', 'multiselect'] and attr_data['options']:
                for opt_id, opt_name in attr_data['options']:
                    _, opt_created = MarketplaceAttributeOption.objects.get_or_create(
                        attribute=attr,
                        external_code=opt_id,
                        defaults={'name': opt_name}
                    )
                    if opt_created:
                        created_opts += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nИмпорт завершён:\n'
            f'  Атрибутов: {len(attributes_data)} (новых: {created_attrs})\n'
            f'  Опций: {created_opts}'
        ))
