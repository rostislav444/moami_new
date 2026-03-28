from typing import Iterator, Dict, Any, Optional, List
import requests
import logging

logger = logging.getLogger(__name__)


class MarketplaceClient:
    """
    Generic marketplace API client.

    All marketplace-specific behavior is driven by api_config:
    {
        "base_url": "https://api.example.com",
        "auth_type": "bearer" | "api_key",
        "token": "...",
        "endpoints": {
            "categories": "/v2/pim/categories",
            "attribute_sets": "/v2/pim/attribute-sets",
            "attribute_options": "/v2/pim/attribute-sets/{set_code}/attributes/{attr_code}/options"
        },
        "translations": {
            "array_field": "translations",
            "lang_field": "languageCode",
            "name_field": "title",
            "option_name_field": "value",
            "suffix_field": "suffix",
            "languages": {"ru": "ru", "uk": "ua"}
        },
        "fields": {
            "categories": {
                "code": "code",
                "parent_code": "parentCode",
                "has_children": "hasChild",
                "is_deleted": "deleted"
            },
            "attributes": {
                "code": "code",
                "type": "type",
                "is_required": "isRequired",
                "is_system": "isSystem",
                "is_model": "isModel",
                "is_filter": "isFilter"
            },
            "options": {
                "code": "code"
            }
        }
    }
    """

    def __init__(self, marketplace):
        from apps.marketplaces.models import Marketplace

        self.marketplace: Marketplace = marketplace
        self.config = marketplace.api_config or {}
        self.base_url = self.config.get('base_url', '')
        self.endpoints = self.config.get('endpoints', {})
        self.translations_config = self.config.get('translations', {})
        self.fields_config = self.config.get('fields', {})
        self.session = requests.Session()
        self._setup_auth()
        self._setup_headers()

    def _setup_auth(self):
        auth_type = self.config.get('auth_type')
        if auth_type == 'bearer':
            token = self.config.get('token')
            if token:
                self.session.headers['Authorization'] = f'Bearer {token}'
        elif auth_type == 'api_key':
            api_key = self.config.get('api_key')
            if api_key:
                self.session.headers['X-API-Key'] = api_key

    def _setup_headers(self):
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        })

    # =========================================================================
    # HTTP helpers
    # =========================================================================

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        url = f'{self.base_url}{endpoint}'
        try:
            response = self.session.request(
                method, url, params=params, json=data, timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f'API request failed: {method} {url} - {e}')
            raise

    def _paginate(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        data_key: str = 'data',
        page_param: str = 'page'
    ) -> Iterator[Dict]:
        page = 1
        params = params or {}

        while True:
            params[page_param] = page
            response = self._request('GET', endpoint, params=params)

            items = response.get(data_key) or response.get('items') or []
            if not items:
                break

            yield from items

            total_pages = response.get('pages', 1)
            if page >= total_pages:
                break
            page += 1

    # =========================================================================
    # Translation / field helpers
    # =========================================================================

    def _get_translation(
        self,
        item: Dict,
        lang_key: str = 'ru',
        field: Optional[str] = None
    ) -> str:
        """Extract translation from item's translations array"""
        tc = self.translations_config
        array_field = tc.get('array_field', 'translations')
        lang_field = tc.get('lang_field', 'languageCode')
        name_field = field or tc.get('name_field', 'title')
        languages = tc.get('languages', {'ru': 'ru', 'uk': 'ua'})

        api_lang = languages.get(lang_key, lang_key)
        translations = item.get(array_field, [])

        for t in translations:
            if t.get(lang_field) == api_lang:
                return t.get(name_field) or t.get('value') or ''

        # Fallback
        if translations:
            return translations[0].get(name_field) or translations[0].get('value') or ''
        return ''

    def _get_suffix(self, item: Dict) -> str:
        """Extract suffix (unit) from translations"""
        tc = self.translations_config
        suffix_field = tc.get('suffix_field', 'suffix')
        array_field = tc.get('array_field', 'translations')

        for t in item.get(array_field, []):
            if t.get(suffix_field):
                return t.get(suffix_field)
        return ''

    def _get_field(self, item: Dict, mapping_key: str, section: str, default=None):
        """Get a field from item using the configured field mapping"""
        field_name = self.fields_config.get(section, {}).get(mapping_key, mapping_key)
        return item.get(field_name, default)

    # =========================================================================
    # Sync methods — fully generic, driven by api_config
    # =========================================================================

    def sync_categories(self) -> int:
        from apps.marketplaces.models import MarketplaceCategory

        endpoint = self.endpoints.get('categories')
        if not endpoint:
            raise ValueError("No 'categories' endpoint configured in api_config")

        fields = self.fields_config.get('categories', {})
        count = 0

        for item in self._paginate(endpoint):
            code = str(item.get(fields.get('code', 'code'), ''))
            if not code:
                continue

            name_ru = self._get_translation(item, 'ru')
            name_uk = self._get_translation(item, 'uk')

            parent_code_field = fields.get('parent_code', 'parentCode')
            has_children_field = fields.get('has_children', 'hasChild')
            is_deleted_field = fields.get('is_deleted', 'deleted')

            MarketplaceCategory.objects.update_or_create(
                marketplace=self.marketplace,
                external_id=code,
                defaults={
                    'external_code': code,
                    'name': name_ru or name_uk or code,
                    'name_uk': name_uk,
                    'has_children': item.get(has_children_field, False),
                    'is_active': not item.get(is_deleted_field, False),
                    'extra_data': {
                        'parent_code': item.get(parent_code_field),
                        'attribute_sets': item.get('attributeSets', []),
                    }
                }
            )
            count += 1

        self._build_category_tree()
        logger.info(f'Synced {count} categories for {self.marketplace.name}')
        return count

    def _build_category_tree(self):
        from apps.marketplaces.models import MarketplaceCategory

        categories = MarketplaceCategory.objects.filter(marketplace=self.marketplace)
        for cat in categories:
            parent_code = cat.extra_data.get('parent_code')
            if parent_code:
                parent = categories.filter(external_code=str(parent_code)).first()
                if parent and cat.parent != parent:
                    cat.parent = parent
                    cat.save(update_fields=['parent'])

        MarketplaceCategory.objects.rebuild()

    def sync_attribute_sets(self, category_codes: Optional[List[str]] = None) -> int:
        from apps.marketplaces.models import (
            MarketplaceCategory,
            MarketplaceAttributeSet,
        )

        endpoint = self.endpoints.get('attribute_sets')
        if not endpoint:
            raise ValueError("No 'attribute_sets' endpoint configured in api_config")

        fields = self.fields_config.get('categories', {})
        count = 0

        # Use API-level filtering when codes are provided
        params = {}
        if category_codes:
            params['filter[codes][]'] = category_codes

        for set_data in self._paginate(endpoint, params=params):
            code = str(set_data.get(fields.get('code', 'code'), ''))
            if not code:
                continue

            name_ru = self._get_translation(set_data, 'ru')
            name_uk = self._get_translation(set_data, 'uk')

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
                    'marketplace_category': mp_category,
                }
            )

            for attr_data in set_data.get('attributes', []):
                self._sync_attribute(attr_set, attr_data)

            count += 1

        logger.info(f'Synced {count} attribute sets for {self.marketplace.name}')
        return count

    def _sync_attribute(self, attr_set, attr_data: dict):
        from apps.marketplaces.models import MarketplaceAttribute

        attr_fields = self.fields_config.get('attributes', {})
        attr_code = str(attr_data.get(attr_fields.get('code', 'code'), ''))
        if not attr_code:
            return

        name_ru = self._get_translation(attr_data, 'ru')
        name_uk = self._get_translation(attr_data, 'uk')
        suffix = self._get_suffix(attr_data)
        attr_type = attr_data.get(attr_fields.get('type', 'type'), 'string')

        MarketplaceAttribute.objects.update_or_create(
            attribute_set=attr_set,
            external_code=attr_code,
            defaults={
                'name': name_ru or name_uk or attr_code,
                'name_uk': name_uk,
                'attr_type': attr_type,
                'is_required': attr_data.get(attr_fields.get('is_required', 'isRequired'), False),
                'is_system': attr_data.get(attr_fields.get('is_system', 'isSystem'), False),
                'suffix': suffix,
                'extra_data': {
                    'is_model': attr_data.get(attr_fields.get('is_model', 'isModel'), False),
                    'is_filter': attr_data.get(attr_fields.get('is_filter', 'isFilter'), False),
                }
            }
        )

    def sync_attribute_options(
        self,
        attribute_set_code: str,
        attribute_code: str
    ) -> int:
        from apps.marketplaces.models import MarketplaceAttribute, MarketplaceAttributeOption

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

        # Build endpoint from template
        template = self.endpoints.get(
            'attribute_options',
            '/v2/pim/attribute-sets/{set_code}/attributes/{attr_code}/options'
        )
        endpoint = template.format(
            set_code=attribute_set_code,
            attr_code=attribute_code
        )

        tc = self.translations_config
        option_name_field = tc.get('option_name_field', 'value')
        opt_fields = self.fields_config.get('options', {})
        count = 0

        for opt_data in self._paginate(endpoint):
            opt_code = str(opt_data.get(opt_fields.get('code', 'code'), ''))
            if not opt_code:
                continue

            name_ru = self._get_translation(opt_data, 'ru', field=option_name_field)
            name_uk = self._get_translation(opt_data, 'uk', field=option_name_field)

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

    def sync_all_options_for_set(self, attribute_set_code: str) -> int:
        from apps.marketplaces.models import MarketplaceAttribute

        total = 0
        attrs = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=self.marketplace,
            attribute_set__external_code=attribute_set_code,
            attr_type__in=['select', 'multiselect']
        )

        for attr in attrs:
            count = self.sync_attribute_options(attribute_set_code, attr.external_code)
            total += count

        return total
