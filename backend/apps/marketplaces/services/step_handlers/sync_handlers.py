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
            source: 'api' | 'data'

        Returns:
            {
                'synced': number of attribute sets synced,
            }
        """
        from apps.marketplaces.services import get_marketplace_client

        config = self.resolve_config(config)

        self.log_info("Syncing attribute sets")

        client = get_marketplace_client(self.marketplace)
        category_codes = config.get('category_codes')

        if category_codes:
            total = 0
            for code in category_codes:
                result = client.sync_attribute_sets(category_code=code)
                total += result
            return {'synced': total}
        else:
            result = client.sync_attribute_sets()
            return {'synced': result}


class SyncOptionsHandler(BaseStepHandler):
    """Handler for syncing attribute options"""

    def validate_config(self, config: dict) -> list[str]:
        return []

    def execute(self, config: dict) -> dict:
        """
        Sync attribute options from API.

        Config:
            attribute_set_id: Specific attribute set to sync (optional)

        Returns:
            {
                'synced': number of options synced,
            }
        """
        from apps.marketplaces.services import get_marketplace_client

        config = self.resolve_config(config)

        self.log_info("Syncing attribute options")

        client = get_marketplace_client(self.marketplace)
        attribute_set_id = config.get('attribute_set_id')

        result = client.sync_attribute_options(attribute_set_id=attribute_set_id)
        return {'synced': result}


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
