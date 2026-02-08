"""
AI Agent для автоматического маппинга товаров на маркетплейсы

Использует Claude API для:
1. Определения категории маркетплейса по данным товара
2. Автозаполнения атрибутов маркетплейса
3. Поиска соответствующих опций (бренд, цвет, материал и т.д.)
4. Поиска информации о категориях и атрибутах в интернете
"""
import json
import logging
import re
import urllib.request
import urllib.parse
from typing import Optional, Dict, List, Any
from django.conf import settings

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    from duckduckgo_search import DDGS
    HAS_DDGS = True
except ImportError:
    HAS_DDGS = False

logger = logging.getLogger(__name__)


class AIMarketplaceMappingAgent:
    """
    AI агент для маппинга товаров на маркетплейсы

    Пример использования:
        agent = AIMarketplaceMappingAgent(marketplace)

        # Найти категорию для товара
        category = agent.suggest_category(product)

        # Автозаполнить атрибуты
        attributes = agent.suggest_attributes(product, category)
    """

    def __init__(self, marketplace, model: str = "claude-sonnet-4-20250514"):
        """
        Args:
            marketplace: объект Marketplace
            model: модель Claude для использования
        """
        if not HAS_ANTHROPIC:
            raise ImportError("anthropic package is required. Install with: pip install anthropic")

        self.marketplace = marketplace
        self.model = model
        self.client = anthropic.Anthropic(
            api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
        )

    def suggest_category(self, product) -> Optional[Dict]:
        """
        Предложить категорию маркетплейса для товара

        Args:
            product: объект Product

        Returns:
            dict с информацией о категории или None
        """
        from apps.marketplaces.models import MarketplaceCategory

        # Получить доступные категории маркетплейса
        categories = MarketplaceCategory.objects.filter(
            marketplace=self.marketplace,
            is_active=True,
            has_children=False  # только листовые категории
        ).values('id', 'external_code', 'name', 'name_uk')

        categories_list = list(categories)
        if not categories_list:
            logger.warning(f"No categories found for marketplace {self.marketplace.name}")
            return None

        # Подготовить данные о товаре
        product_info = self._get_product_info(product)

        # Запрос к Claude
        prompt = f"""Проанализируй товар и выбери наиболее подходящую категорию маркетплейса.

ТОВАР:
{json.dumps(product_info, ensure_ascii=False, indent=2)}

ДОСТУПНЫЕ КАТЕГОРИИ:
{json.dumps(categories_list, ensure_ascii=False, indent=2)}

Выбери ОДНУ наиболее подходящую категорию. Ответь ТОЛЬКО в формате JSON:
{{"category_id": <id>, "external_code": "<code>", "confidence": <0.0-1.0>, "reason": "<причина выбора>"}}
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text.strip()
            # Извлечь JSON из ответа
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            logger.info(f"AI suggested category {result.get('external_code')} for product {product.id}")
            return result

        except Exception as e:
            logger.error(f"Error suggesting category: {e}")
            return None

    def suggest_attributes(
        self,
        product,
        category_code: str,
        include_optional: bool = False
    ) -> List[Dict]:
        """
        Предложить значения атрибутов для товара

        Args:
            product: объект Product
            category_code: код категории маркетплейса
            include_optional: включить необязательные атрибуты

        Returns:
            Список предложенных атрибутов
        """
        from apps.marketplaces.models import MarketplaceAttributeSet, MarketplaceAttribute

        # Получить набор атрибутов категории
        attr_set = MarketplaceAttributeSet.objects.filter(
            marketplace=self.marketplace,
            external_code=category_code
        ).first()

        if not attr_set:
            logger.warning(f"Attribute set not found for category {category_code}")
            return []

        # Получить атрибуты
        attrs_query = attr_set.attributes.all()
        if not include_optional:
            attrs_query = attrs_query.filter(is_required=True)

        attributes = []
        for attr in attrs_query:
            attr_info = {
                'id': attr.id,
                'code': attr.external_code,
                'name': attr.name,
                'type': attr.attr_type,
                'is_required': attr.is_required,
            }

            # Для select/multiselect добавить список опций
            if attr.has_options:
                options = list(attr.options.values('id', 'external_code', 'name')[:100])
                attr_info['options'] = options

            attributes.append(attr_info)

        if not attributes:
            return []

        # Подготовить данные о товаре
        product_info = self._get_product_info(product)

        # Запрос к Claude
        prompt = f"""Проанализируй товар и заполни атрибуты для маркетплейса.

ТОВАР:
{json.dumps(product_info, ensure_ascii=False, indent=2)}

АТРИБУТЫ ДЛЯ ЗАПОЛНЕНИЯ:
{json.dumps(attributes, ensure_ascii=False, indent=2)}

Для каждого атрибута предложи значение на основе данных товара.
- Для select/multiselect - выбери из доступных options (по id или external_code)
- Для string/text - предложи текст
- Для int/float - предложи число

Ответь ТОЛЬКО в формате JSON массива:
[
  {{"attribute_code": "<code>", "value": <значение>, "option_id": <id опции если select>}},
  ...
]

Если не можешь определить значение атрибута - пропусти его.
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text.strip()
            # Извлечь JSON из ответа
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            logger.info(f"AI suggested {len(result)} attributes for product {product.id}")
            return result

        except Exception as e:
            logger.error(f"Error suggesting attributes: {e}")
            return []

    def find_option_match(
        self,
        attribute,
        value: str,
        threshold: float = 0.7
    ) -> Optional[Dict]:
        """
        Найти соответствующую опцию для значения

        Args:
            attribute: объект MarketplaceAttribute
            value: значение для поиска
            threshold: минимальный порог уверенности

        Returns:
            dict с информацией об опции или None
        """
        if not attribute.has_options:
            return None

        options = list(attribute.options.values('id', 'external_code', 'name', 'name_uk')[:200])
        if not options:
            return None

        prompt = f"""Найди наиболее подходящую опцию для значения.

ЗНАЧЕНИЕ ДЛЯ ПОИСКА: "{value}"

ДОСТУПНЫЕ ОПЦИИ:
{json.dumps(options, ensure_ascii=False, indent=2)}

Выбери наиболее подходящую опцию. Учитывай синонимы и вариации написания.
Ответь ТОЛЬКО в формате JSON:
{{"option_id": <id>, "external_code": "<code>", "confidence": <0.0-1.0>}}

Если подходящей опции нет (confidence < {threshold}), ответь: {{"option_id": null, "confidence": 0}}
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text.strip()
            if "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()

            result = json.loads(result_text)

            if result.get('confidence', 0) >= threshold:
                return result
            return None

        except Exception as e:
            logger.error(f"Error finding option match: {e}")
            return None

    def auto_map_product(self, product) -> Dict[str, Any]:
        """
        Полный автоматический маппинг товара на маркетплейс

        Args:
            product: объект Product

        Returns:
            dict с результатами маппинга
        """
        from apps.marketplaces.models import (
            ProductMarketplaceConfig,
            ProductMarketplaceAttribute,
            MarketplaceAttribute
        )

        result = {
            'product_id': product.id,
            'marketplace': self.marketplace.name,
            'category': None,
            'attributes': [],
            'errors': []
        }

        # 1. Определить категорию
        category_suggestion = self.suggest_category(product)
        if not category_suggestion:
            result['errors'].append("Не удалось определить категорию")
            return result

        result['category'] = category_suggestion
        category_code = category_suggestion.get('external_code')

        # 2. Создать/обновить конфигурацию товара
        config, _ = ProductMarketplaceConfig.objects.update_or_create(
            product=product,
            marketplace=self.marketplace,
            defaults={'is_active': True}
        )

        # 3. Получить предложения по атрибутам
        attr_suggestions = self.suggest_attributes(product, category_code, include_optional=True)

        # 4. Сохранить атрибуты
        for suggestion in attr_suggestions:
            attr_code = suggestion.get('attribute_code')
            value = suggestion.get('value')
            option_id = suggestion.get('option_id')

            try:
                mp_attr = MarketplaceAttribute.objects.get(
                    attribute_set__marketplace=self.marketplace,
                    attribute_set__external_code=category_code,
                    external_code=attr_code
                )

                defaults = {}
                if mp_attr.attr_type in ['select', 'multiselect'] and option_id:
                    defaults['value_option_id'] = option_id
                elif mp_attr.attr_type == 'string':
                    defaults['value_string'] = str(value) if value else None
                elif mp_attr.attr_type == 'text':
                    defaults['value_text'] = str(value) if value else None
                elif mp_attr.attr_type == 'int':
                    defaults['value_int'] = int(value) if value else None
                elif mp_attr.attr_type == 'float':
                    defaults['value_float'] = float(value) if value else None

                ProductMarketplaceAttribute.objects.update_or_create(
                    product=product,
                    marketplace_attribute=mp_attr,
                    defaults=defaults
                )

                result['attributes'].append({
                    'code': attr_code,
                    'name': mp_attr.name,
                    'value': value,
                    'saved': True
                })

            except MarketplaceAttribute.DoesNotExist:
                result['errors'].append(f"Атрибут {attr_code} не найден")
            except Exception as e:
                result['errors'].append(f"Ошибка сохранения {attr_code}: {str(e)}")

        return result

    def _get_product_info(self, product) -> Dict:
        """Собрать информацию о товаре для AI"""
        info = {
            'name': product.name,
            'category': product.category.name if product.category else None,
        }

        # Описание
        if hasattr(product, 'get_description'):
            info['description'] = product.get_description()
        elif hasattr(product, 'description'):
            info['description'] = product.description

        # Бренд
        if hasattr(product, 'brand') and product.brand:
            info['brand'] = product.brand.name

        # Страна
        if hasattr(product, 'country') and product.country:
            info['country'] = product.country.name

        # Цвета (из вариантов)
        if hasattr(product, 'variants'):
            colors = set()
            for variant in product.variants.all()[:10]:
                if hasattr(variant, 'color') and variant.color:
                    colors.add(variant.color.name)
            if colors:
                info['colors'] = list(colors)

        # Базовые атрибуты товара
        if hasattr(product, 'attributes'):
            attrs = {}
            for pa in product.attributes.all().select_related('attribute_group', 'value_single_attribute')[:20]:
                group_name = pa.attribute_group.name if pa.attribute_group else 'other'
                if pa.value_single_attribute:
                    attrs[group_name] = pa.value_single_attribute.name
            if attrs:
                info['attributes'] = attrs

        # Состав
        if hasattr(product, 'compositions'):
            compositions = []
            for pc in product.compositions.all().select_related('composition')[:10]:
                if pc.composition:
                    compositions.append({
                        'material': pc.composition.name,
                        'percentage': pc.percentage
                    })
            if compositions:
                info['composition'] = compositions

        return info


class AIAttributeMapper:
    """
    Простой маппер атрибутов без AI (для fallback)

    Использует простое сопоставление по названию
    """

    def __init__(self, marketplace):
        self.marketplace = marketplace

    def find_brand_option(self, brand_name: str) -> Optional[int]:
        """Найти опцию бренда по названию"""
        from apps.marketplaces.models import MarketplaceAttributeOption

        # Точное совпадение
        option = MarketplaceAttributeOption.objects.filter(
            attribute__attribute_set__marketplace=self.marketplace,
            attribute__external_code='brand',
            name__iexact=brand_name
        ).first()

        if option:
            return option.id

        # Частичное совпадение
        option = MarketplaceAttributeOption.objects.filter(
            attribute__attribute_set__marketplace=self.marketplace,
            attribute__external_code='brand',
            name__icontains=brand_name
        ).first()

        return option.id if option else None

    def find_color_option(self, color_name: str) -> Optional[int]:
        """Найти опцию цвета по названию"""
        from apps.marketplaces.models import MarketplaceAttributeOption

        # Маппинг популярных цветов
        COLOR_MAP = {
            'красный': 'red',
            'синий': 'blue',
            'зеленый': 'green',
            'черный': 'black',
            'белый': 'white',
            'бежевый': 'beige',
            'розовый': 'pink',
            # ...
        }

        search_terms = [color_name.lower()]
        if color_name.lower() in COLOR_MAP:
            search_terms.append(COLOR_MAP[color_name.lower()])

        for term in search_terms:
            option = MarketplaceAttributeOption.objects.filter(
                attribute__attribute_set__marketplace=self.marketplace,
                attribute__external_code__in=['base_color', 'color'],
                name__icontains=term
            ).first()

            if option:
                return option.id

        return None


class AIWebSearchAgent:
    """
    AI агент с веб-поиском для автоматического обнаружения
    атрибутов категорий маркетплейсов.

    Использует встроенный web_search Claude API или DuckDuckGo как fallback.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        if not HAS_ANTHROPIC:
            raise ImportError("anthropic package is required")

        self.model = model
        self.client = anthropic.Anthropic(
            api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
        )

    def search_with_claude(self, query: str) -> Dict[str, Any]:
        """
        Использовать веб-поиск Claude API напрямую.

        Args:
            query: что искать

        Returns:
            dict с результатами
        """
        prompt = f"""Найди информацию в интернете: {query}

Верни найденную информацию в структурированном виде с указанием источников (URL).
"""
        try:
            # Используем web_search tool в Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                tools=[{"type": "web_search_20250305"}],
                messages=[{"role": "user", "content": prompt}]
            )

            # Извлекаем результаты
            text_content = ""
            for block in response.content:
                if hasattr(block, 'text'):
                    text_content += block.text + "\n"

            return {
                'success': True,
                'content': text_content.strip()
            }

        except Exception as e:
            logger.warning(f"Claude web search error: {e}")
            return {'success': False, 'error': str(e)}

    def search_web(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Поиск в интернете через DuckDuckGo (fallback)

        Args:
            query: поисковый запрос
            max_results: максимальное количество результатов

        Returns:
            Список результатов поиска [{title, url, body}, ...]
        """
        if HAS_DDGS:
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=max_results))
                    return results
            except Exception as e:
                logger.error(f"DuckDuckGo search error: {e}")

        return []

    def discover_category_attributes(
        self,
        marketplace_name: str,
        category_name: str,
        language: str = 'uk'
    ) -> Dict[str, Any]:
        """
        Найти информацию об атрибутах категории маркетплейса.
        Сначала пробует веб-поиск, если не работает - использует знания Claude.

        Args:
            marketplace_name: название маркетплейса (Rozetka, Epicentr, Prom.ua, etc.)
            category_name: название категории (женские блузы, платья, etc.)
            language: язык поиска (uk, ru, en)

        Returns:
            dict с найденными атрибутами и источниками
        """
        # Формируем поисковые запросы
        queries = [
            f"{marketplace_name} {category_name} характеристики товара XML param",
            f"{marketplace_name} {category_name} атрибуты обязательные поля",
        ]

        all_search_results = []
        for query in queries:
            results = self.search_web(query, max_results=3)
            all_search_results.extend(results)

        # Если есть результаты поиска - используем их
        if all_search_results:
            search_context = "\n\n".join([
                f"Источник: {r.get('title', 'N/A')}\nURL: {r.get('href', r.get('url', 'N/A'))}\nТекст: {r.get('body', '')[:500]}"
                for r in all_search_results[:8]
            ])

            prompt = f"""Проанализируй результаты поиска и извлеки информацию об атрибутах категории товаров.

МАРКЕТПЛЕЙС: {marketplace_name}
КАТЕГОРИЯ: {category_name}

РЕЗУЛЬТАТЫ ПОИСКА:
{search_context}

Задача: на основе найденной информации составь список атрибутов.
"""
        else:
            # Fallback: используем знания Claude о маркетплейсе
            logger.info(f"Web search returned no results, using Claude knowledge for {marketplace_name}/{category_name}")
            prompt = f"""Ты эксперт по маркетплейсам Украины. Тебе нужно определить типичные атрибуты для категории товаров.

МАРКЕТПЛЕЙС: {marketplace_name}
КАТЕГОРИЯ: {category_name}

Известная информация о маркетплейсах:
- Rozetka.ua - крупнейший маркетплейс Украины, использует XML/YML фиды с тегами <param name="..." paramid="...">
- Epicentr - маркетплейс строительных и бытовых товаров, имеет API для категорий и атрибутов
- Prom.ua - универсальный маркетплейс, использует XML фиды
- ModnaKasta - маркетплейс одежды и обуви

Для категории одежды типичные атрибуты:
- Размер (обязательный, select) - размерная сетка
- Цвет (обязательный, multiselect) - базовые цвета
- Материал/Состав (обязательный, text) - состав ткани
- Бренд (обязательный, select) - производитель
- Страна производства (обязательный, select)
- Сезон (select) - Лето, Зима, Весна-Осень, Демисезон
- Пол (select) - Женский, Мужской, Унисекс
- Длина рукава (select) - для блуз, платьев
- Тип застежки (select)
- Стиль (multiselect) - Casual, Деловой, Вечерний

Задача: составь список атрибутов для данной категории на данном маркетплейсе.
"""

        prompt += f"""

Ответь в формате JSON:
{{
    "success": true,
    "marketplace": "{marketplace_name}",
    "category": "{category_name}",
    "attributes": [
        {{
            "name": "название атрибута на русском",
            "name_uk": "назва українською",
            "code": "код_атрибута",
            "type": "select|multiselect|string|int|float|text",
            "is_required": true/false,
            "description": "описание",
            "possible_values": ["значение1", "значение2"]
        }}
    ],
    "sources": ["Claude AI knowledge"],
    "notes": "дополнительные заметки"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            result_text = response.content[0].text.strip()

            # Извлечь JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            logger.info(f"Discovered {len(result.get('attributes', []))} attributes for {marketplace_name}/{category_name}")
            return result

        except Exception as e:
            logger.error(f"Error discovering attributes: {e}")
            return {
                'success': False,
                'error': str(e),
                'attributes': []
            }

    def create_attributes_from_discovery(
        self,
        marketplace,
        category_external_code: str,
        discovery_result: Dict
    ) -> Dict[str, Any]:
        """
        Создать наборы атрибутов в БД на основе результатов discovery.

        Args:
            marketplace: объект Marketplace
            category_external_code: код категории маркетплейса
            discovery_result: результат discover_category_attributes

        Returns:
            dict с результатами создания
        """
        from apps.marketplaces.models import (
            MarketplaceAttributeSet,
            MarketplaceAttribute,
            MarketplaceAttributeOption
        )

        if not discovery_result.get('success'):
            return {'success': False, 'error': discovery_result.get('error')}

        attributes = discovery_result.get('attributes', [])
        if not attributes:
            return {'success': False, 'error': 'Атрибуты не найдены'}

        # Создаём набор атрибутов
        category_name = discovery_result.get('category', category_external_code)
        attr_set, created = MarketplaceAttributeSet.objects.get_or_create(
            marketplace=marketplace,
            external_code=category_external_code,
            defaults={
                'name': category_name,
                'name_uk': category_name,
                'is_active': True,
            }
        )

        created_attrs = []
        for attr_data in attributes:
            attr_code = attr_data.get('code') or self._slugify(attr_data.get('name', ''))
            if not attr_code:
                continue

            attr, attr_created = MarketplaceAttribute.objects.update_or_create(
                attribute_set=attr_set,
                external_code=attr_code,
                defaults={
                    'name': attr_data.get('name', attr_code),
                    'name_uk': attr_data.get('name_uk'),
                    'attr_type': attr_data.get('type', 'string'),
                    'is_required': attr_data.get('is_required', False),
                    'is_system': False,
                }
            )

            # Создаём опции для select/multiselect
            possible_values = attr_data.get('possible_values', [])
            if possible_values and attr.attr_type in ['select', 'multiselect']:
                for i, value in enumerate(possible_values[:50]):  # лимит 50 опций
                    MarketplaceAttributeOption.objects.get_or_create(
                        attribute=attr,
                        external_code=self._slugify(value) or f"opt_{i}",
                        defaults={'name': value}
                    )

            created_attrs.append({
                'code': attr_code,
                'name': attr.name,
                'created': attr_created
            })

        return {
            'success': True,
            'attribute_set_id': attr_set.id,
            'attribute_set_created': created,
            'attributes': created_attrs
        }

    def _slugify(self, text: str) -> str:
        """Преобразовать текст в slug"""
        if not text:
            return ''
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '_', text)
        return text[:50]
