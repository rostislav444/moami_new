"""
Сервис для поиска опций атрибутов в маркетплейсах

Вместо синхронизации всех 30k+ опций - ищем конкретные по мере необходимости.
"""
import logging
from typing import Optional, List, Dict
import requests

logger = logging.getLogger(__name__)


class MarketplaceOptionFinder:
    """
    Поиск опций атрибутов в API маркетплейса

    Пример использования:
        finder = MarketplaceOptionFinder(marketplace)

        # Найти бренд
        brand_option = finder.find_brand('MOAMI')

        # Найти цвет
        color_option = finder.find_color('красный', category_code='6390')
    """

    def __init__(self, marketplace):
        self.marketplace = marketplace
        self.config = marketplace.api_config or {}
        self.base_url = self.config.get('base_url', '')
        self.token = self.config.get('token', '')

    def _request(self, endpoint: str, params: dict = None) -> dict:
        """Выполнить запрос к API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API request failed: {url} - {e}")
            return {}

    def find_brand(self, brand_name: str, category_code: str = None) -> Optional[Dict]:
        """
        Найти бренд в опциях маркетплейса

        Args:
            brand_name: название бренда для поиска
            category_code: код категории (опционально, для поиска в конкретном наборе атрибутов)

        Returns:
            dict с информацией об опции или None
        """
        from apps.marketplaces.models import (
            MarketplaceAttributeSet,
            MarketplaceAttribute,
            MarketplaceAttributeOption,
            BrandMapping
        )
        from apps.product.models import Brand

        # Сначала проверяем есть ли уже маппинг
        brand = Brand.objects.filter(name__iexact=brand_name).first()
        if brand:
            mapping = BrandMapping.objects.filter(
                brand=brand,
                marketplace_entity__marketplace=self.marketplace
            ).select_related('marketplace_entity').first()

            if mapping:
                return {
                    'code': mapping.marketplace_entity.external_code,
                    'name': mapping.marketplace_entity.name,
                    'cached': True
                }

        # Ищем в уже загруженных опциях
        existing = MarketplaceAttributeOption.objects.filter(
            attribute__attribute_set__marketplace=self.marketplace,
            attribute__external_code='brand',
            name__iexact=brand_name
        ).first()

        if existing:
            return {
                'id': existing.id,
                'code': existing.external_code,
                'name': existing.name,
                'cached': True
            }

        # Ищем через API
        # Берём первый набор атрибутов для поиска
        if category_code:
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=self.marketplace,
                external_code=category_code
            ).first()
        else:
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=self.marketplace
            ).first()

        if not attr_set:
            return None

        # Поиск в API с фильтром по названию
        endpoint = f"/v2/pim/attribute-sets/{attr_set.external_code}/attributes/brand/options"

        # Пробуем поиск по странице
        page = 1
        while page <= 100:  # Ограничение на случай бесконечного цикла
            data = self._request(endpoint, {'page': page})
            items = data.get('data') or data.get('items') or []

            if not items:
                break

            for item in items:
                name = self._get_translation(item.get('translations', []), 'ru')
                if name and name.lower() == brand_name.lower():
                    # Нашли! Сохраняем в БД
                    attr = MarketplaceAttribute.objects.filter(
                        attribute_set=attr_set,
                        external_code='brand'
                    ).first()

                    if attr:
                        option, _ = MarketplaceAttributeOption.objects.update_or_create(
                            attribute=attr,
                            external_code=str(item.get('code')),
                            defaults={
                                'name': name,
                                'name_uk': self._get_translation(item.get('translations', []), 'ua'),
                            }
                        )

                        return {
                            'id': option.id,
                            'code': option.external_code,
                            'name': option.name,
                            'cached': False
                        }

            page += 1

        logger.warning(f"Brand '{brand_name}' not found in marketplace {self.marketplace.name}")
        return None

    def find_option(
        self,
        category_code: str,
        attribute_code: str,
        search_value: str
    ) -> Optional[Dict]:
        """
        Найти опцию атрибута по значению

        Args:
            category_code: код категории/набора атрибутов
            attribute_code: код атрибута
            search_value: значение для поиска

        Returns:
            dict с информацией об опции или None
        """
        from apps.marketplaces.models import (
            MarketplaceAttributeSet,
            MarketplaceAttribute,
            MarketplaceAttributeOption
        )

        # Сначала ищем в кэше
        existing = MarketplaceAttributeOption.objects.filter(
            attribute__attribute_set__marketplace=self.marketplace,
            attribute__attribute_set__external_code=category_code,
            attribute__external_code=attribute_code,
            name__iexact=search_value
        ).first()

        if existing:
            return {
                'id': existing.id,
                'code': existing.external_code,
                'name': existing.name,
                'cached': True
            }

        # Ищем через API
        endpoint = f"/v2/pim/attribute-sets/{category_code}/attributes/{attribute_code}/options"

        page = 1
        while page <= 50:
            data = self._request(endpoint, {'page': page})
            items = data.get('data') or data.get('items') or []

            if not items:
                break

            for item in items:
                name_ru = self._get_translation(item.get('translations', []), 'ru')
                name_uk = self._get_translation(item.get('translations', []), 'ua')

                # Проверяем совпадение
                if (name_ru and name_ru.lower() == search_value.lower()) or \
                   (name_uk and name_uk.lower() == search_value.lower()):

                    # Сохраняем в БД
                    attr = MarketplaceAttribute.objects.filter(
                        attribute_set__marketplace=self.marketplace,
                        attribute_set__external_code=category_code,
                        external_code=attribute_code
                    ).first()

                    if attr:
                        option, _ = MarketplaceAttributeOption.objects.update_or_create(
                            attribute=attr,
                            external_code=str(item.get('code')),
                            defaults={
                                'name': name_ru or name_uk,
                                'name_uk': name_uk,
                            }
                        )

                        return {
                            'id': option.id,
                            'code': option.external_code,
                            'name': option.name,
                            'cached': False
                        }

            page += 1

        return None

    def find_color(self, color_name: str, category_code: str) -> Optional[Dict]:
        """Найти цвет (обёртка над find_option)"""
        # Epicentr использует 'base_color' для базового цвета
        return self.find_option(category_code, 'base_color', color_name)

    def find_all_store_brands(self) -> List[Dict]:
        """
        Найти все бренды магазина в маркетплейсе

        Returns:
            Список найденных соответствий
        """
        from apps.product.models import Brand

        results = []
        brands = Brand.objects.all()

        for brand in brands:
            result = self.find_brand(brand.name)
            results.append({
                'store_brand': brand.name,
                'marketplace_option': result
            })

        return results

    def _get_translation(self, translations: list, lang: str = 'ru') -> str:
        """Получить перевод"""
        for t in translations:
            if t.get('languageCode') == lang:
                return t.get('title') or t.get('value') or ''
        if translations:
            return translations[0].get('title') or translations[0].get('value') or ''
        return ''


def map_store_brands_to_marketplace(marketplace) -> Dict:
    """
    Утилита: замаппить все бренды магазина на маркетплейс

    Returns:
        Статистика маппинга
    """
    from apps.product.models import Brand
    from apps.marketplaces.models import MarketplaceEntity, BrandMapping

    finder = MarketplaceOptionFinder(marketplace)
    stats = {'found': 0, 'not_found': 0, 'errors': []}

    for brand in Brand.objects.all():
        try:
            result = finder.find_brand(brand.name)

            if result:
                # Создаём MarketplaceEntity и BrandMapping
                entity, _ = MarketplaceEntity.objects.update_or_create(
                    marketplace=marketplace,
                    entity_type='brand',
                    external_code=result['code'],
                    defaults={'name': result['name']}
                )

                BrandMapping.objects.update_or_create(
                    brand=brand,
                    defaults={'marketplace_entity': entity}
                )

                stats['found'] += 1
                logger.info(f"Mapped brand '{brand.name}' -> '{result['code']}'")
            else:
                stats['not_found'] += 1
                logger.warning(f"Brand '{brand.name}' not found in marketplace")

        except Exception as e:
            stats['errors'].append(f"{brand.name}: {str(e)}")
            logger.error(f"Error mapping brand '{brand.name}': {e}")

    return stats
