from typing import Optional, List
import logging

from .base_api_client import BaseMarketplaceClient

logger = logging.getLogger(__name__)


class EpicentrClient(BaseMarketplaceClient):
    """
    Клиент для API Epicentr

    API Endpoints:
    - GET /v2/pim/categories - список категорий
    - GET /v2/pim/attribute-sets - наборы атрибутов
    - GET /v2/pim/attribute-sets/{setCode}/attributes/{attrCode}/options - опции атрибута
    """

    def sync_categories(self) -> int:
        """
        Синхронизация категорий из API Epicentr

        GET /v2/pim/categories

        Returns:
            Количество синхронизированных категорий
        """
        from apps.marketplaces.models import MarketplaceCategory

        count = 0
        endpoint = self.config.get('endpoints', {}).get('categories', '/v2/pim/categories')

        for cat_data in self._paginate(endpoint):
            code = str(cat_data.get('code', ''))
            if not code:
                continue

            translations = cat_data.get('translations', [])
            name_ru = self._get_translation(translations, 'ru')
            name_uk = self._get_translation(translations, 'ua')

            MarketplaceCategory.objects.update_or_create(
                marketplace=self.marketplace,
                external_id=code,
                defaults={
                    'external_code': code,
                    'name': name_ru or name_uk or code,
                    'name_uk': name_uk,
                    'has_children': cat_data.get('hasChild', False),
                    'is_active': not cat_data.get('deleted', False),
                    'extra_data': {
                        'parent_code': cat_data.get('parentCode'),
                        'attribute_sets': cat_data.get('attributeSets', []),
                    }
                }
            )
            count += 1

        # Построить дерево категорий
        self._build_category_tree()

        logger.info(f'Synced {count} categories for {self.marketplace.name}')
        return count

    def _build_category_tree(self):
        """Устанавливает parent для категорий на основе parent_code"""
        from apps.marketplaces.models import MarketplaceCategory

        categories = MarketplaceCategory.objects.filter(marketplace=self.marketplace)

        for cat in categories:
            parent_code = cat.extra_data.get('parent_code')
            if parent_code:
                parent = categories.filter(external_code=str(parent_code)).first()
                if parent and cat.parent != parent:
                    cat.parent = parent
                    cat.save(update_fields=['parent'])

        # Перестроить дерево MPTT
        MarketplaceCategory.objects.rebuild()

    def sync_attribute_sets(self, category_codes: Optional[List[str]] = None) -> int:
        """
        Синхронизация наборов атрибутов

        GET /v2/pim/attribute-sets

        Args:
            category_codes: опциональный список кодов категорий

        Returns:
            Количество синхронизированных наборов
        """
        from apps.marketplaces.models import (
            MarketplaceCategory,
            MarketplaceAttributeSet,
            MarketplaceAttribute
        )

        count = 0
        endpoint = self.config.get('endpoints', {}).get(
            'attribute_sets',
            '/v2/pim/attribute-sets'
        )

        for set_data in self._paginate(endpoint):
            code = str(set_data.get('code', ''))
            if not code:
                continue

            # Фильтр по кодам категорий, если указаны
            if category_codes and code not in category_codes:
                continue

            translations = set_data.get('translations', [])
            name_ru = self._get_translation(translations, 'ru')
            name_uk = self._get_translation(translations, 'ua')

            # Найти связанную категорию
            mp_category = MarketplaceCategory.objects.filter(
                marketplace=self.marketplace,
                external_code=code
            ).first()

            attr_set, _ = MarketplaceAttributeSet.objects.update_or_create(
                marketplace=self.marketplace,
                external_code=code,
                defaults={
                    'name': name_ru or name_uk or code,
                    'name_uk': name_uk,
                    'marketplace_category': mp_category
                }
            )

            # Синхронизировать атрибуты набора
            attributes = set_data.get('attributes', [])
            for attr_data in attributes:
                self._sync_attribute(attr_set, attr_data)

            count += 1

        logger.info(f'Synced {count} attribute sets for {self.marketplace.name}')
        return count

    def _sync_attribute(self, attr_set, attr_data: dict):
        """Синхронизация отдельного атрибута"""
        from apps.marketplaces.models import MarketplaceAttribute

        attr_code = str(attr_data.get('code', ''))
        if not attr_code:
            return

        translations = attr_data.get('translations', [])
        name_ru = self._get_translation(translations, 'ru')
        name_uk = self._get_translation(translations, 'ua')

        # Получить суффикс (единица измерения)
        suffix = ''
        for t in translations:
            if t.get('suffix'):
                suffix = t.get('suffix')
                break

        attr_type = attr_data.get('type', 'string')

        MarketplaceAttribute.objects.update_or_create(
            attribute_set=attr_set,
            external_code=attr_code,
            defaults={
                'name': name_ru or name_uk or attr_code,
                'name_uk': name_uk,
                'attr_type': attr_type,
                'is_required': attr_data.get('isRequired', False),
                'is_system': attr_data.get('isSystem', False),
                'suffix': suffix,
                'extra_data': {
                    'is_model': attr_data.get('isModel', False),
                    'is_filter': attr_data.get('isFilter', False),
                }
            }
        )

    def sync_attribute_options(
        self,
        attribute_set_code: str,
        attribute_code: str
    ) -> int:
        """
        Синхронизация опций атрибута

        GET /v2/pim/attribute-sets/{setCode}/attributes/{attrCode}/options

        Args:
            attribute_set_code: код набора атрибутов
            attribute_code: код атрибута

        Returns:
            Количество синхронизированных опций
        """
        from apps.marketplaces.models import MarketplaceAttribute, MarketplaceAttributeOption

        # Найти атрибут
        attribute = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=self.marketplace,
            attribute_set__external_code=attribute_set_code,
            external_code=attribute_code
        ).first()

        if not attribute:
            logger.warning(
                f'Attribute not found: set={attribute_set_code}, attr={attribute_code}'
            )
            return 0

        count = 0
        endpoint = f'/v2/pim/attribute-sets/{attribute_set_code}/attributes/{attribute_code}/options'

        for opt_data in self._paginate(endpoint):
            opt_code = str(opt_data.get('code', ''))
            if not opt_code:
                continue

            translations = opt_data.get('translations', [])
            # Для опций используется поле 'value' вместо 'title'
            name_ru = self._get_translation(translations, 'ru', field='value')
            name_uk = self._get_translation(translations, 'ua', field='value')

            MarketplaceAttributeOption.objects.update_or_create(
                attribute=attribute,
                external_code=opt_code,
                defaults={
                    'name': name_ru or name_uk or opt_code,
                    'name_uk': name_uk,
                }
            )
            count += 1

        logger.info(
            f'Synced {count} options for attribute {attribute.name} '
            f'(set: {attribute_set_code})'
        )
        return count

    def sync_entities(self, entity_type: str = 'brand') -> int:
        """
        Синхронизация сущностей (бренды, страны и т.д.)

        Для Epicentr бренды и страны загружаются как опции системных атрибутов.

        Args:
            entity_type: тип сущности ('brand', 'country', 'color', 'measure')

        Returns:
            Количество синхронизированных сущностей
        """
        from apps.marketplaces.models import MarketplaceEntity, MarketplaceAttributeOption

        # Маппинг типа сущности на код системного атрибута
        attr_codes = {
            'brand': 'brand',
            'country': 'country_of_origin',
            'measure': 'measure',
        }

        attr_code = attr_codes.get(entity_type)
        if not attr_code:
            logger.warning(f'Unknown entity type: {entity_type}')
            return 0

        count = 0

        # Получить опции из всех attribute sets
        options = MarketplaceAttributeOption.objects.filter(
            attribute__attribute_set__marketplace=self.marketplace,
            attribute__external_code=attr_code
        ).distinct('external_code')

        for opt in options:
            MarketplaceEntity.objects.update_or_create(
                marketplace=self.marketplace,
                entity_type=entity_type,
                external_id=opt.external_code,
                defaults={
                    'external_code': opt.external_code,
                    'name': opt.name,
                    'name_uk': opt.name_uk,
                }
            )
            count += 1

        logger.info(f'Synced {count} {entity_type} entities for {self.marketplace.name}')
        return count
