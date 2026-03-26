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

    # Entity-type attributes — skip, they use entity mappings (BrandMapping etc.)
    SKIP_CODES = {'brand', 'country_of_origin', 'measure'}

    def execute(self, config: dict) -> dict:
        """
        Sync attribute options from API.

        Iterates over select/multiselect attributes and loads their options.
        Skips entity-type attributes (brand, country, measure).
        Deduplicates by external_code — loads once per unique attr, copies to duplicates.

        Config:
            use_mapped: If true, only process attributes from mapped categories (default: true)
            category_codes: Explicit list of category codes (optional)
        """
        from apps.marketplaces.services import get_marketplace_client
        from apps.marketplaces.models import (
            MarketplaceAttribute, MarketplaceAttributeOption, CategoryMapping
        )

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

        # Get select/multiselect attributes, exclude entity-type
        attrs_query = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=self.marketplace,
            attr_type__in=['select', 'multiselect'],
        ).exclude(
            external_code__in=self.SKIP_CODES
        )

        if category_codes:
            attrs_query = attrs_query.filter(
                attribute_set__external_code__in=category_codes
            )

        attrs = list(attrs_query.select_related('attribute_set'))

        # Deduplicate: group by external_code, load once, copy to others
        by_code = {}
        for attr in attrs:
            code = attr.external_code
            if code not in by_code:
                by_code[code] = []
            by_code[code].append(attr)

        unique_count = len(by_code)
        self.log_info(
            f"Found {len(attrs)} attrs, {unique_count} unique codes "
            f"(skipping entity codes: {self.SKIP_CODES}). "
            f"Loading once per unique code, options shared via external_code."
        )

        client = get_marketplace_client(self.marketplace)
        total_options = 0

        for i, (code, attr_group) in enumerate(by_code.items()):
            if i % 20 == 0 and i > 0:
                self.log_info(f"Progress: {i}/{unique_count} unique attrs, {total_options} options")

            # Check if ANY attribute with this code already has options
            has_options = MarketplaceAttributeOption.objects.filter(
                attribute__external_code=code,
                attribute__attribute_set__marketplace=self.marketplace,
            ).exists()

            if has_options:
                continue

            # Load for the first attribute only — others will share via external_code
            primary = attr_group[0]
            count = client.sync_attribute_options(
                attribute_set_code=primary.attribute_set.external_code,
                attribute_code=primary.external_code,
            )
            total_options += count

        self.log_info(f"Done: {total_options} options loaded for {unique_count} unique attributes")
        return {
            'synced': total_options,
            'unique_attributes': unique_count,
            'total_attributes': len(attrs),
            'skipped_entity_codes': list(self.SKIP_CODES),
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
