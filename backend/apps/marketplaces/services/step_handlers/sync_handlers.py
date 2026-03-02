from .base import BaseStepHandler


class SyncCategoriesHandler(BaseStepHandler):
    """Handler for syncing marketplace categories"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        # Categories can be synced from API or from parsed data
        return errors

    def execute(self, config: dict) -> dict:
        """
        Sync categories from API or parsed data.

        Config:
            source: 'api' | 'data'
            data: Parsed categories data (if source is 'data')
            clear_existing: Whether to clear existing categories first

        Returns:
            {
                'synced': number of categories synced,
                'created': number created,
                'updated': number updated,
            }
        """
        from apps.marketplaces.services import get_marketplace_client

        config = self.resolve_config(config)
        source = config.get('source', 'api')

        self.log_info(f"Syncing categories from {source}")

        if source == 'api':
            # Use existing API client
            client = get_marketplace_client(self.marketplace)
            result = client.sync_categories()
            return {
                'synced': result,
                'source': 'api',
            }

        elif source == 'data':
            # Sync from parsed data
            from apps.marketplaces.models import MarketplaceCategory

            data = config.get('data', [])
            created = 0
            updated = 0

            for item in data:
                cat, is_created = MarketplaceCategory.objects.update_or_create(
                    marketplace=self.marketplace,
                    external_id=item.get('id') or item.get('external_id'),
                    defaults={
                        'external_code': item.get('code') or item.get('external_code', ''),
                        'name': item.get('name', ''),
                        'name_uk': item.get('name_uk'),
                    }
                )
                if is_created:
                    created += 1
                else:
                    updated += 1

            self.log_info(f"Synced {created + updated} categories ({created} new, {updated} updated)")
            return {
                'synced': created + updated,
                'created': created,
                'updated': updated,
                'source': 'data',
            }

        else:
            raise ValueError(f"Unknown source: {source}")


class SyncAttributesHandler(BaseStepHandler):
    """Handler for syncing marketplace attribute sets"""

    def validate_config(self, config: dict) -> list[str]:
        return []

    def execute(self, config: dict) -> dict:
        """
        Sync attribute sets from API.

        Config:
            category_codes: List of category codes to sync (optional)
            use_mapped: If true, auto-resolve codes from mapped categories (default: true)

        Returns:
            {
                'synced': number of attribute sets synced,
                'category_codes': list of codes used,
            }
        """
        from apps.marketplaces.services import get_marketplace_client

        config = self.resolve_config(config)
        category_codes = config.get('category_codes')

        # Auto-resolve from mapped categories if not specified
        if not category_codes and config.get('use_mapped', True):
            category_codes = self._get_mapped_category_codes()
            self.log_info(f"Auto-resolved {len(category_codes)} mapped category codes")

        client = get_marketplace_client(self.marketplace)

        if category_codes:
            self.log_info(f"Syncing attribute sets for {len(category_codes)} categories")
            result = client.sync_attribute_sets(category_codes=category_codes)
            return {
                'synced': result,
                'category_codes': category_codes,
                'mode': 'mapped_only',
            }
        else:
            self.log_info("Syncing ALL attribute sets (no mapped categories found)")
            result = client.sync_attribute_sets()
            return {'synced': result, 'mode': 'all'}

    def _get_mapped_category_codes(self) -> list[str]:
        """Get external_code list from mapped categories"""
        from apps.marketplaces.models import CategoryMapping

        return list(
            CategoryMapping.objects.filter(
                marketplace_category__marketplace=self.marketplace
            ).values_list(
                'marketplace_category__external_code', flat=True
            ).distinct()
        )


class SyncOptionsHandler(BaseStepHandler):
    """Handler for syncing attribute options"""

    def validate_config(self, config: dict) -> list[str]:
        return []

    def execute(self, config: dict) -> dict:
        """
        Sync attribute options from API.

        Iterates over select/multiselect attributes and loads their options.

        Config:
            use_mapped: If true, only process attributes from mapped categories (default: true)
            category_codes: Explicit list of category codes (optional)

        Returns:
            {
                'synced': total options synced,
                'attributes_processed': number of attributes processed,
            }
        """
        from apps.marketplaces.services import get_marketplace_client
        from apps.marketplaces.models import MarketplaceAttribute, CategoryMapping

        config = self.resolve_config(config)
        category_codes = config.get('category_codes')

        # Auto-resolve from mapped categories
        if not category_codes and config.get('use_mapped', True):
            category_codes = list(
                CategoryMapping.objects.filter(
                    marketplace_category__marketplace=self.marketplace
                ).values_list(
                    'marketplace_category__external_code', flat=True
                ).distinct()
            )
            self.log_info(f"Auto-resolved {len(category_codes)} mapped category codes")

        # Get select/multiselect attributes
        attrs_query = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=self.marketplace,
            attr_type__in=['select', 'multiselect'],
        )

        if category_codes:
            attrs_query = attrs_query.filter(
                attribute_set__external_code__in=category_codes
            )

        attrs = list(attrs_query.select_related('attribute_set'))
        self.log_info(f"Processing options for {len(attrs)} select/multiselect attributes")

        client = get_marketplace_client(self.marketplace)
        total_options = 0

        for i, attr in enumerate(attrs):
            if i % 50 == 0 and i > 0:
                self.log_info(f"Progress: {i}/{len(attrs)} attributes processed, {total_options} options loaded")

            count = client.sync_attribute_options(
                attribute_set_code=attr.attribute_set.external_code,
                attribute_code=attr.external_code,
            )
            total_options += count

        self.log_info(f"Synced {total_options} options for {len(attrs)} attributes")
        return {
            'synced': total_options,
            'attributes_processed': len(attrs),
            'mode': 'mapped_only' if category_codes else 'all',
        }


class SyncEntitiesHandler(BaseStepHandler):
    """Handler for syncing entities (brands, colors, countries, etc.)"""

    def validate_config(self, config: dict) -> list[str]:
        errors = []
        if not config.get('entity_type'):
            errors.append("'entity_type' is required")
        return errors

    def execute(self, config: dict) -> dict:
        """
        Sync entities from API.

        Config:
            entity_type: 'brand' | 'color' | 'country' | 'size' | 'measure'

        Returns:
            {
                'synced': number of entities synced,
            }
        """
        from apps.marketplaces.services import get_marketplace_client

        config = self.resolve_config(config)
        entity_type = config['entity_type']

        self.log_info(f"Syncing entities: {entity_type}")

        client = get_marketplace_client(self.marketplace)
        result = client.sync_entities(entity_type)

        return {'synced': result, 'entity_type': entity_type}
