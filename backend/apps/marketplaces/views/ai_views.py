from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.conf import settings

import logging
import json
import io

logger = logging.getLogger(__name__)


class AIAssistantViewSet(viewsets.ViewSet):
    """
    AI Ассистент для автоматического маппинга товаров

    Endpoints:
    - POST /api/ai/suggest-category/ - предложить категорию для товара
    - POST /api/ai/suggest-attributes/ - предложить атрибуты для товара
    - POST /api/ai/auto-map-product/ - полный автомаппинг товара
    - POST /api/ai/auto-map-bulk/ - массовый автомаппинг товаров
    - POST /api/ai/parse_attributes_file/ - парсинг XLSX/CSV файла с атрибутами
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_agent(self, marketplace_id: int):
        """Получить AI агента для маркетплейса"""
        from apps.marketplaces.models import Marketplace
        from apps.marketplaces.services.ai_mapping_agent import AIMarketplaceMappingAgent

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
            return AIMarketplaceMappingAgent(marketplace)
        except Marketplace.DoesNotExist:
            return None
        except ImportError as e:
            logger.error(f"Failed to import AI agent: {e}")
            return None

    @action(detail=False, methods=['post'])
    def suggest_category(self, request):
        """
        Предложить категорию маркетплейса для товара

        POST /api/ai/suggest-category/
        Body: {
            "marketplace_id": 1,
            "product_id": 123
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')

        if not marketplace_id or not product_id:
            return Response(
                {'error': 'marketplace_id and product_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available. Check ANTHROPIC_API_KEY setting.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.suggest_category(product)
            return Response({
                'success': True,
                'suggestion': result
            })
        except Exception as e:
            logger.error(f"AI suggest_category error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def suggest_attributes(self, request):
        """
        Предложить атрибуты для товара

        POST /api/ai/suggest-attributes/
        Body: {
            "marketplace_id": 1,
            "product_id": 123,
            "category_code": "6390",
            "include_optional": false
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')
        category_code = request.data.get('category_code')
        include_optional = request.data.get('include_optional', False)

        if not all([marketplace_id, product_id, category_code]):
            return Response(
                {'error': 'marketplace_id, product_id, and category_code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.suggest_attributes(product, category_code, include_optional)
            return Response({
                'success': True,
                'attributes': result
            })
        except Exception as e:
            logger.error(f"AI suggest_attributes error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def auto_map_product(self, request):
        """
        Полный автоматический маппинг товара

        POST /api/ai/auto-map-product/
        Body: {
            "marketplace_id": 1,
            "product_id": 123
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')

        if not marketplace_id or not product_id:
            return Response(
                {'error': 'marketplace_id and product_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.auto_map_product(product)
            return Response(result)
        except Exception as e:
            logger.error(f"AI auto_map_product error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def auto_map_bulk(self, request):
        """
        Массовый автомаппинг товаров

        POST /api/ai/auto-map-bulk/
        Body: {
            "marketplace_id": 1,
            "product_ids": [1, 2, 3],
            "category_id": 5  // опционально - фильтр по категории
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_ids = request.data.get('product_ids', [])
        category_id = request.data.get('category_id')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Получить товары
        if product_ids:
            products = Product.objects.filter(id__in=product_ids)
        elif category_id:
            products = Product.objects.filter(category_id=category_id)[:50]  # Лимит
        else:
            products = Product.objects.all()[:20]  # Лимит

        results = []
        for product in products:
            try:
                result = agent.auto_map_product(product)
                results.append(result)
            except Exception as e:
                results.append({
                    'product_id': product.id,
                    'error': str(e)
                })

        return Response({
            'success': True,
            'processed': len(results),
            'results': results
        })

    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Проверить статус AI ассистента

        GET /api/ai/status/
        """
        has_api_key = bool(getattr(settings, 'ANTHROPIC_API_KEY', None))

        try:
            import anthropic
            has_library = True
        except ImportError:
            has_library = False

        return Response({
            'available': has_api_key and has_library,
            'has_api_key': has_api_key,
            'has_library': has_library,
            'message': 'AI assistant is ready' if (has_api_key and has_library) else 'Missing API key or anthropic library'
        })

    @action(detail=False, methods=['post'])
    def parse_attributes_file(self, request):
        """
        Универсальный парсинг XLSX/CSV файла с атрибутами (AI + Python)

        Трёхэтапный процесс:
        1. AI анализирует первые 30 строк → определяет структуру и маппинг колонок
        2. Python парсит ВСЕ данные по этому конфигу
        3. AI маппит типы данных (ComboBox → select и т.д.)

        POST /api/ai/parse_attributes_file/
        Content-Type: multipart/form-data
        Body: file (XLSX или CSV)
        """
        import anthropic
        import openpyxl
        import csv

        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл не загружен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']
        filename = uploaded_file.name.lower()

        # ===== ШАГ 1: Читаем файл =====
        all_sheets_info = {}  # {sheet_name: first_10_rows}
        target_sheet_name = None

        try:
            if filename.endswith('.xlsx') or filename.endswith('.xls'):
                workbook = openpyxl.load_workbook(io.BytesIO(uploaded_file.read()))

                # Собираем информацию о ВСЕХ вкладках
                for sheet_name in workbook.sheetnames:
                    sheet = workbook[sheet_name]
                    sheet_rows = []
                    for i, row in enumerate(sheet.iter_rows(values_only=True)):
                        if i >= 10:  # только первые 10 строк каждой вкладки
                            break
                        if any(cell is not None for cell in row):
                            sheet_rows.append([str(cell).strip() if cell is not None else '' for cell in row])
                    all_sheets_info[sheet_name] = sheet_rows

                # Пока используем первую вкладку, AI определит нужную
                sheet = workbook.active
                rows = []
                for row in sheet.iter_rows(values_only=True):
                    if any(cell is not None for cell in row):
                        rows.append([str(cell).strip() if cell is not None else '' for cell in row])
                target_sheet_name = sheet.title

            elif filename.endswith('.csv'):
                content = uploaded_file.read().decode('utf-8-sig')
                # Пробуем разные разделители
                if '\t' in content:
                    reader = csv.reader(io.StringIO(content), delimiter='\t')
                else:
                    reader = csv.reader(io.StringIO(content))
                rows = [row for row in reader if any(cell.strip() for cell in row)]

            else:
                return Response(
                    {'error': 'Неподдерживаемый формат файла. Используйте XLSX или CSV.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return Response(
                {'error': f'Ошибка чтения файла: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(rows) < 2:
            return Response(
                {'error': 'Файл пустой или содержит меньше 2 строк'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ===== ШАГ 2: AI анализирует структуру =====
        # Формируем информацию о всех вкладках для AI
        sheets_preview = ""
        if all_sheets_info:
            sheets_preview = "ВКЛАДКИ В ФАЙЛЕ:\n"
            for sheet_name, sheet_rows in all_sheets_info.items():
                sheets_preview += f"\n=== Вкладка: \"{sheet_name}\" ===\n"
                for row in sheet_rows[:5]:
                    sheets_preview += '\t'.join(row[:10]) + '\n'  # первые 10 колонок
                sheets_preview += "...\n"

        sample_rows = rows[:30]
        sample_text = '\n'.join(['\t'.join(row) for row in sample_rows])

        try:
            client = anthropic.Anthropic(
                api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
            )

            structure_prompt = f"""Проанализируй Excel файл с атрибутами товаров маркетплейса.

⚠️ ВАЖНО: Файл может содержать НЕСКОЛЬКО вкладок!
- Первая вкладка часто содержит ШАБЛОН ТОВАРОВ (примеры заполнения) - это НЕ атрибуты!
- Атрибуты обычно находятся на вкладках с названиями категорий (Одяг, Взуття) или "Характеристики"

{sheets_preview}

ТЕКУЩАЯ ВКЛАДКА "{target_sheet_name}" (первые 30 строк):
{sample_text}

ЗАДАЧА:
1. Посмотри на ВСЕ вкладки выше
2. Определи - на какой вкладке находятся АТРИБУТЫ (список характеристик), а не данные о товарах
3. Если текущая вкладка содержит данные о товарах (артикулы, цены, названия товаров) - укажи правильную вкладку в "correct_sheet"

Атрибуты обычно выглядят так:
- Колонка с ID/кодом атрибута
- Колонка с названием атрибута (Бренд, Размер, Цвет...)
- Возможные значения атрибутов

Шаблон товаров выглядит так:
- ID поставщика, Артикул, Штрих-код, Название товара, Цена...

Ответь ТОЛЬКО валидным JSON:
{{
    "correct_sheet": null,
    "header_row": 1,
    "data_start_row": 2,
    "category_name": "Женские джинсы",
    "columns": {{
        "attr_id": 0,
        "attr_name": 1,
        "attr_type": 2,
        "is_required": 3,
        "value_name": 6,
        "unit": 4
    }},
    "required_true_values": ["Да", "Yes", "True", "+", "1", "Так"],
    "ignored_columns": [5, 7],
    "notes": "Краткое описание"
}}

ВАЖНО:
- "correct_sheet": null если текущая вкладка правильная, или "Название вкладки" если нужно читать другую
- Если видишь данные о товарах вместо атрибутов - ОБЯЗАТЕЛЬНО укажи в correct_sheet правильную вкладку!
- Если какой-то колонки нет - укажи null в columns"""

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": structure_prompt}]
            )

            result_text = response.content[0].text.strip()

            # Извлекаем JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            structure = json.loads(result_text)
            logger.info(f"AI detected structure: {structure}")

            # Если AI указал другую вкладку - перечитываем данные
            correct_sheet = structure.get('correct_sheet')
            if correct_sheet and correct_sheet != target_sheet_name:
                logger.info(f"AI указал другую вкладку: {correct_sheet}")
                if correct_sheet in all_sheets_info:
                    # Перечитываем данные из правильной вкладки
                    uploaded_file.seek(0)
                    workbook = openpyxl.load_workbook(io.BytesIO(uploaded_file.read()))
                    sheet = workbook[correct_sheet]
                    rows = []
                    for row in sheet.iter_rows(values_only=True):
                        if any(cell is not None for cell in row):
                            rows.append([str(cell).strip() if cell is not None else '' for cell in row])
                    target_sheet_name = correct_sheet

                    # Нужно заново проанализировать структуру этой вкладки
                    sample_rows = rows[:30]
                    sample_text = '\n'.join(['\t'.join(row) for row in sample_rows])

                    reanalyze_prompt = f"""Проанализируй вкладку "{correct_sheet}" с атрибутами:

{sample_text}

Найди колонки:
- attr_id: ID/код атрибута
- attr_name: название атрибута
- attr_type: тип данных
- is_required: обязательность
- value_name: возможное значение
- unit: единица измерения

Ответь ТОЛЬКО валидным JSON:
{{
    "header_row": 0,
    "data_start_row": 1,
    "category_name": null,
    "columns": {{
        "attr_id": null,
        "attr_name": 0,
        "attr_type": null,
        "is_required": null,
        "value_name": null,
        "unit": null
    }},
    "required_true_values": [],
    "notes": "описание"
}}

Если это формат "атрибуты в колонках" (каждая колонка = атрибут, строки = значения):
{{
    "format": "columns_as_attributes",
    "header_row": 0,
    "data_start_row": 1,
    "notes": "Каждая колонка это атрибут, строки содержат возможные значения"
}}"""

                    response = client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=1000,
                        messages=[{"role": "user", "content": reanalyze_prompt}]
                    )

                    result_text = response.content[0].text.strip()
                    if "```json" in result_text:
                        result_text = result_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in result_text:
                        result_text = result_text.split("```")[1].split("```")[0].strip()

                    structure = json.loads(result_text)
                    structure['correct_sheet'] = None  # уже на правильной вкладке
                    structure['parsed_sheet'] = correct_sheet
                    logger.info(f"Re-analyzed structure for sheet {correct_sheet}: {structure}")
                else:
                    logger.warning(f"Sheet {correct_sheet} not found in file")

        except Exception as e:
            logger.error(f"AI structure analysis error: {e}")
            return Response(
                {'error': f'Ошибка анализа структуры: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ===== ШАГ 3: Проверяем формат "атрибуты в колонках" =====
        if structure.get('format') == 'columns_as_attributes':
            # Специальная обработка: каждая колонка = атрибут
            header_row = structure.get('header_row', 0)
            data_start_row = structure.get('data_start_row', 1)

            if header_row < len(rows):
                headers = rows[header_row]
                attributes = []

                for col_idx, attr_name in enumerate(headers):
                    if not attr_name or not attr_name.strip():
                        continue

                    # Собираем уникальные значения из этой колонки
                    possible_values = set()
                    for row in rows[data_start_row:]:
                        if col_idx < len(row) and row[col_idx] and row[col_idx].strip():
                            possible_values.add(row[col_idx].strip())

                    attributes.append({
                        'name': attr_name.strip(),
                        'code': f"col_{col_idx}",
                        'original_type': 'columns_format',
                        'is_required': False,
                        'possible_values': list(possible_values)[:100],
                        'unit': None,
                        'type': 'select' if possible_values else 'string'
                    })

                return Response({
                    'success': True,
                    'category_name': structure.get('category_name'),
                    'attributes': attributes,
                    'structure': structure,
                    'type_mapping': {},
                    'stats': {
                        'total_rows': len(rows),
                        'attributes_count': len(attributes),
                        'format': 'columns_as_attributes',
                        'parsed_sheet': target_sheet_name
                    }
                })

        # ===== ШАГ 4: Python парсит ВСЕ данные по конфигу от AI =====
        columns = structure.get('columns', {})
        data_start = structure.get('data_start_row', 1)
        category_name = structure.get('category_name')
        required_true_values = structure.get('required_true_values', ['Да', 'Yes', 'True', '+', '1', 'Так'])

        col_attr_id = columns.get('attr_id')
        col_attr_name = columns.get('attr_name')
        col_attr_type = columns.get('attr_type')
        col_is_required = columns.get('is_required')
        col_value_name = columns.get('value_name')
        col_unit = columns.get('unit')

        if col_attr_id is None or col_attr_name is None:
            return Response({
                'error': 'AI не смог определить колонки с ID и названием атрибута',
                'structure': structure
            }, status=status.HTTP_400_BAD_REQUEST)

        data_rows = rows[data_start:]
        attributes_dict = {}
        unique_types = set()

        # Normalize required_true_values for comparison
        required_true_values_lower = [str(v).lower().strip() for v in required_true_values]

        for row in data_rows:
            if len(row) <= max(filter(lambda x: x is not None, [col_attr_id, col_attr_name, col_attr_type, col_is_required, col_value_name, col_unit] + [0])):
                continue

            attr_id = row[col_attr_id] if col_attr_id is not None and col_attr_id < len(row) else None
            attr_name = row[col_attr_name] if col_attr_name is not None and col_attr_name < len(row) else None
            attr_type = row[col_attr_type] if col_attr_type is not None and col_attr_type < len(row) else None
            is_required_raw = row[col_is_required] if col_is_required is not None and col_is_required < len(row) else None
            value_name = row[col_value_name] if col_value_name is not None and col_value_name < len(row) else None
            unit = row[col_unit] if col_unit is not None and col_unit < len(row) else None

            if not attr_id or not attr_name:
                continue

            # Determine if required
            is_required = False
            if is_required_raw:
                is_required = str(is_required_raw).lower().strip() in required_true_values_lower

            # Собираем уникальные типы
            if attr_type:
                unique_types.add(attr_type)

            if attr_id not in attributes_dict:
                unit_value = None
                if unit and unit.strip() and unit.strip().upper() not in ['N/D', 'N/A', '-', '']:
                    unit_value = unit.strip()

                attributes_dict[attr_id] = {
                    'name': attr_name,
                    'code': attr_id,
                    'original_type': attr_type or '',
                    'is_required': is_required,
                    'possible_values': [],
                    'unit': unit_value,
                }
            else:
                # Update is_required if any row says it's required
                if is_required:
                    attributes_dict[attr_id]['is_required'] = True

            # Добавляем значение
            if value_name and value_name.strip():
                if value_name not in attributes_dict[attr_id]['possible_values']:
                    attributes_dict[attr_id]['possible_values'].append(value_name)

        # ===== ШАГ 4: AI маппит типы данных =====
        type_mapping = {}
        if unique_types:
            try:
                types_prompt = f"""Вот список типов данных атрибутов из файла маркетплейса:
{list(unique_types)}

Сопоставь каждый тип с одним из наших внутренних типов:
- select: выбор одного значения из списка (dropdown, combobox)
- multiselect: выбор нескольких значений (checkbox list, multiple select)
- string: короткая строка (до 255 символов)
- text: длинный текст (textarea)
- int: целое число
- float: дробное число
- boolean: да/нет

Ответь ТОЛЬКО валидным JSON:
{{
    "ComboBox": "select",
    "ListValues": "multiselect",
    "String": "string"
}}"""

                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    messages=[{"role": "user", "content": types_prompt}]
                )

                type_result = response.content[0].text.strip()
                if "```json" in type_result:
                    type_result = type_result.split("```json")[1].split("```")[0].strip()
                elif "```" in type_result:
                    type_result = type_result.split("```")[1].split("```")[0].strip()

                type_mapping = json.loads(type_result)
                logger.info(f"AI type mapping: {type_mapping}")

            except Exception as e:
                logger.warning(f"AI type mapping error: {e}, using defaults")

        # Применяем маппинг типов
        for attr in attributes_dict.values():
            original_type = attr.get('original_type', '')
            if original_type in type_mapping:
                attr['type'] = type_mapping[original_type]
            else:
                # Fallback на простую эвристику
                type_lower = original_type.lower()
                if 'combo' in type_lower or 'select' in type_lower or 'list' in type_lower:
                    attr['type'] = 'select'
                elif 'multi' in type_lower or 'check' in type_lower:
                    attr['type'] = 'multiselect'
                elif 'int' in type_lower or 'number' in type_lower:
                    attr['type'] = 'int'
                elif 'float' in type_lower or 'decimal' in type_lower:
                    attr['type'] = 'float'
                elif 'bool' in type_lower:
                    attr['type'] = 'boolean'
                elif 'text' in type_lower:
                    attr['type'] = 'text'
                else:
                    attr['type'] = 'string'

        attributes = list(attributes_dict.values())

        return Response({
            'success': True,
            'category_name': category_name,
            'attributes': attributes,
            'structure': structure,
            'type_mapping': type_mapping,
            'stats': {
                'total_rows': len(rows),
                'data_rows': len(data_rows),
                'attributes_count': len(attributes),
                'unique_types': list(unique_types)
            }
        })

    @action(detail=False, methods=['post'])
    def save_parsed_attributes(self, request):
        """
        Сохранить распарсенные атрибуты в БД

        POST /api/ai/save_parsed_attributes/
        Body: {
            "marketplace_id": 1,
            "category_code": "4637175",
            "category_name": "Женские блузы",
            "attributes": [...]
        }
        """
        from apps.marketplaces.models import (
            Marketplace,
            MarketplaceAttributeSet,
            MarketplaceAttribute,
            MarketplaceAttributeOption
        )
        import re

        marketplace_id = request.data.get('marketplace_id')
        category_code = request.data.get('category_code')
        category_name = request.data.get('category_name', category_code)
        attributes = request.data.get('attributes', [])

        if not marketplace_id or not category_code:
            return Response(
                {'error': 'marketplace_id и category_code обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Маркетплейс не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Создаём набор атрибутов
        attr_set, set_created = MarketplaceAttributeSet.objects.get_or_create(
            marketplace=marketplace,
            external_code=category_code,
            defaults={
                'name': category_name,
                'name_uk': category_name,
            }
        )

        def slugify(text):
            if not text:
                return ''
            text = text.lower().strip()
            text = re.sub(r'[^\w\s-]', '', text)
            text = re.sub(r'[-\s]+', '_', text)
            return text[:50]

        created_attrs = []
        for attr_data in attributes:
            attr_code = attr_data.get('code') or slugify(attr_data.get('name', ''))
            if not attr_code:
                continue

            # Собираем extra_data
            extra_data = {}
            if attr_data.get('original_type'):
                extra_data['original_type'] = attr_data['original_type']
            if attr_data.get('unit'):
                extra_data['unit'] = attr_data['unit']

            attr_name = attr_data.get('name', attr_code)
            attr, attr_created = MarketplaceAttribute.objects.update_or_create(
                attribute_set=attr_set,
                external_code=attr_code,
                defaults={
                    'name': attr_name,
                    'name_uk': attr_data.get('name_uk') or attr_name,  # fallback to name
                    'attr_type': attr_data.get('type', 'string'),
                    'is_required': attr_data.get('is_required', False),
                    'is_system': False,
                    'suffix': attr_data.get('unit') or '',
                    'extra_data': extra_data,
                }
            )

            # Создаём опции
            possible_values = attr_data.get('possible_values', [])
            if possible_values and attr.attr_type in ['select', 'multiselect']:
                for i, value in enumerate(possible_values[:100]):
                    MarketplaceAttributeOption.objects.get_or_create(
                        attribute=attr,
                        external_code=slugify(str(value)) or f"opt_{i}",
                        defaults={'name': str(value)}
                    )

            created_attrs.append({
                'code': attr_code,
                'name': attr.name,
                'created': attr_created,
                'options_count': len(possible_values)
            })

        return Response({
            'success': True,
            'attribute_set_id': attr_set.id,
            'attribute_set_created': set_created,
            'attributes_count': len(created_attrs),
            'attributes': created_attrs
        })

    @action(detail=False, methods=['post'])
    def discover_attributes(self, request):
        """
        Найти атрибуты категории маркетплейса в интернете

        POST /api/ai/discover_attributes/
        Body: {
            "marketplace_name": "Rozetka",
            "category_name": "Женские блузы"
        }
        """
        from apps.marketplaces.services.ai_mapping_agent import AIWebSearchAgent

        marketplace_name = request.data.get('marketplace_name')
        category_name = request.data.get('category_name')

        if not marketplace_name or not category_name:
            return Response(
                {'error': 'marketplace_name and category_name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            agent = AIWebSearchAgent()
            result = agent.discover_category_attributes(marketplace_name, category_name)
            return Response(result)
        except ImportError as e:
            return Response(
                {'error': 'AI agent not available: ' + str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"AI discover_attributes error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def create_discovered_attributes(self, request):
        """
        Создать атрибуты из результатов discovery в БД

        POST /api/ai/create_discovered_attributes/
        Body: {
            "marketplace_id": 1,
            "category_code": "4637175",
            "discovery_result": { ... результат discover_attributes ... }
        }
        """
        from apps.marketplaces.models import Marketplace
        from apps.marketplaces.services.ai_mapping_agent import AIWebSearchAgent

        marketplace_id = request.data.get('marketplace_id')
        category_code = request.data.get('category_code')
        discovery_result = request.data.get('discovery_result')

        if not all([marketplace_id, category_code, discovery_result]):
            return Response(
                {'error': 'marketplace_id, category_code, and discovery_result are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            agent = AIWebSearchAgent()
            result = agent.create_attributes_from_discovery(
                marketplace, category_code, discovery_result
            )
            return Response(result)
        except Exception as e:
            logger.error(f"AI create_discovered_attributes error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def suggest_category_mappings(self, request):
        """
        AI предлагает маппинг между нашими категориями и категориями маркетплейса

        POST /api/ai/suggest_category_mappings/
        Body: {
            "marketplace_id": 1
        }
        """
        import anthropic
        from apps.marketplaces.models import Marketplace, MarketplaceCategory, CategoryMapping
        from apps.categories.models import Category

        marketplace_id = request.data.get('marketplace_id')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Получаем наши категории которые ещё не замаплены
        existing_mappings = CategoryMapping.objects.filter(
            marketplace_category__marketplace=marketplace
        ).values_list('category_id', flat=True)
        our_categories = Category.objects.exclude(id__in=existing_mappings).filter(
            children__isnull=True  # только листовые
        ).values('id', 'name')

        if not our_categories:
            return Response({
                'success': True,
                'suggestions': [],
                'message': 'Все категории уже замаплены'
            })

        # Получаем листовые категории маркетплейса
        mp_categories = MarketplaceCategory.objects.filter(
            marketplace=marketplace,
            children__isnull=True
        ).values('id', 'name', 'external_code')

        if not mp_categories:
            return Response({
                'success': False,
                'error': 'Нет категорий маркетплейса для маппинга'
            })

        # Формируем данные для AI
        our_cats_text = '\n'.join([f"ID:{c['id']} - {c['name']}" for c in our_categories[:50]])
        mp_cats_text = '\n'.join([f"ID:{c['id']} - {c['name']}" for c in mp_categories[:100]])

        try:
            client = anthropic.Anthropic(
                api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
            )

            prompt = f"""Ты помогаешь сопоставить категории интернет-магазина одежды с категориями маркетплейса.

НАШИ КАТЕГОРИИ (интернет-магазин одежды):
{our_cats_text}

КАТЕГОРИИ МАРКЕТПЛЕЙСА ({marketplace.name}):
{mp_cats_text}

Задача: для каждой нашей категории найди наиболее подходящую категорию маркетплейса.
Учитывай семантическое сходство названий, синонимы, варианты написания (укр/рус).

Ответь ТОЛЬКО валидным JSON массивом:
[
  {{"our_id": 123, "mp_id": 456, "confidence": 0.95, "reason": "Точное совпадение"}},
  {{"our_id": 124, "mp_id": 457, "confidence": 0.8, "reason": "Синоним: блузы = блузки"}}
]

Правила:
- confidence от 0.0 до 1.0 (уверенность в сопоставлении)
- Включай только уверенные сопоставления (confidence >= 0.6)
- Если не нашёл подходящую категорию - не включай в ответ
- reason должен быть кратким (до 50 символов)"""

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text.strip()

            # Извлекаем JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            suggestions = json.loads(result_text)
            logger.info(f"AI suggested {len(suggestions)} category mappings")

            # Добавляем имена категорий для UI
            our_cats_dict = {c['id']: c['name'] for c in our_categories}
            mp_cats_dict = {c['id']: c['name'] for c in mp_categories}

            for s in suggestions:
                s['our_name'] = our_cats_dict.get(s['our_id'], 'Unknown')
                s['mp_name'] = mp_cats_dict.get(s['mp_id'], 'Unknown')

            return Response({
                'success': True,
                'suggestions': suggestions,
                'total_our_categories': len(our_categories),
                'total_mp_categories': len(mp_categories)
            })

        except Exception as e:
            logger.error(f"AI suggest_category_mappings error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def auto_discover_and_create(self, request):
        """
        Одним запросом найти и создать атрибуты для категории

        POST /api/ai/auto_discover_and_create/
        Body: {
            "marketplace_id": 1,
            "category_id": 123
        }
        """
        from apps.marketplaces.models import Marketplace, MarketplaceCategory
        from apps.marketplaces.services.ai_mapping_agent import AIWebSearchAgent

        marketplace_id = request.data.get('marketplace_id')
        category_id = request.data.get('category_id')

        if not marketplace_id or not category_id:
            return Response(
                {'error': 'marketplace_id and category_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
            category = MarketplaceCategory.objects.get(id=category_id, marketplace=marketplace)
        except (Marketplace.DoesNotExist, MarketplaceCategory.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            agent = AIWebSearchAgent()

            # 1. Найти атрибуты в интернете
            discovery_result = agent.discover_category_attributes(
                marketplace.name,
                category.name
            )

            if not discovery_result.get('success'):
                return Response({
                    'success': False,
                    'phase': 'discovery',
                    'error': discovery_result.get('error')
                })

            # 2. Создать атрибуты в БД
            create_result = agent.create_attributes_from_discovery(
                marketplace,
                category.external_code,
                discovery_result
            )

            return Response({
                'success': create_result.get('success'),
                'discovery': discovery_result,
                'created': create_result
            })

        except Exception as e:
            logger.error(f"AI auto_discover_and_create error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
