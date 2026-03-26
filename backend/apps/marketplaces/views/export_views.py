from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceCategory,
    CategoryMapping,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
    AttributeMapping,
    MarketplaceEntity,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
    ProductMarketplaceConfig,
    ProductMarketplaceAttribute,
)


class ExportConfigViewSet(viewsets.ViewSet):
    """
    Экспорт конфигурации маркетплейса в JSON

    GET /export-config/{marketplace_id}/full/ — полный экспорт
    GET /export-config/{marketplace_id}/categories/ — только категории
    GET /export-config/{marketplace_id}/attribute-mappings/ — маппинг атрибутов
    GET /export-config/{marketplace_id}/entity-mappings/ — маппинг сущностей
    GET /export-config/{marketplace_id}/attribute-sets/ — наборы атрибутов
    GET /export-config/{marketplace_id}/products/ — конфигурации товаров
    """

    def _get_marketplace(self, pk):
        try:
            return Marketplace.objects.get(pk=pk)
        except Marketplace.DoesNotExist:
            return None

    def _export_marketplace(self, marketplace):
        return {
            'name': marketplace.name,
            'slug': marketplace.slug,
            'integration_type': marketplace.integration_type,
            'is_active': marketplace.is_active,
            'api_config': marketplace.api_config,
            'feed_template': marketplace.feed_template,
            'feed_filename': marketplace.feed_filename,
            'feed_url': marketplace.feed_url,
            'last_sync': str(marketplace.last_sync) if marketplace.last_sync else None,
        }

    def _export_category_mappings(self, marketplace):
        mappings = CategoryMapping.objects.filter(
            marketplace_category__marketplace=marketplace,
            is_active=True,
        ).select_related('category', 'marketplace_category')

        return [
            {
                'our_category_id': m.category_id,
                'our_category_name': m.category.name,
                'mp_category_id': m.marketplace_category_id,
                'mp_category_external_id': m.marketplace_category.external_id,
                'mp_category_external_code': m.marketplace_category.external_code,
                'mp_category_name': m.marketplace_category.name,
                'mp_category_full_path': m.marketplace_category.get_full_path(),
                'custom_name': m.custom_name,
            }
            for m in mappings
        ]

    def _export_attribute_mappings(self, marketplace):
        mappings = AttributeMapping.objects.filter(
            marketplace_attribute__attribute_set__marketplace=marketplace,
        ).select_related(
            'our_attribute',
            'our_attribute__attribute_group',
            'marketplace_attribute',
            'marketplace_attribute__attribute_set',
            'marketplace_option',
        )

        return [
            {
                'our_attribute_id': m.our_attribute_id,
                'our_attribute_name': m.our_attribute.name,
                'our_attribute_group_id': m.our_attribute.attribute_group_id,
                'our_attribute_group_name': m.our_attribute.attribute_group.name,
                'mp_attribute_id': m.marketplace_attribute_id,
                'mp_attribute_code': m.marketplace_attribute.external_code,
                'mp_attribute_name': m.marketplace_attribute.name,
                'mp_attribute_type': m.marketplace_attribute.attr_type,
                'mp_attribute_set_code': m.marketplace_attribute.attribute_set.external_code,
                'mp_attribute_set_name': m.marketplace_attribute.attribute_set.name,
                'mp_option_id': m.marketplace_option_id,
                'mp_option_code': m.marketplace_option.external_code if m.marketplace_option else None,
                'mp_option_name': m.marketplace_option.name if m.marketplace_option else None,
            }
            for m in mappings
        ]

    def _export_entity_mappings(self, marketplace):
        result = {}

        # Бренды
        brand_mappings = BrandMapping.objects.filter(
            marketplace_entity__marketplace=marketplace,
        ).select_related('brand', 'marketplace_entity')
        result['brands'] = [
            {
                'our_brand_id': m.brand_id,
                'our_brand_name': m.brand.name,
                'mp_entity_id': m.marketplace_entity_id,
                'mp_entity_external_id': m.marketplace_entity.external_id,
                'mp_entity_name': m.marketplace_entity.name,
            }
            for m in brand_mappings
        ]

        # Цвета
        color_mappings = ColorMapping.objects.filter(
            marketplace_entity__marketplace=marketplace,
        ).select_related('color', 'marketplace_entity')
        result['colors'] = [
            {
                'our_color_id': m.color_id,
                'our_color_name': m.color.name,
                'mp_entity_id': m.marketplace_entity_id,
                'mp_entity_external_id': m.marketplace_entity.external_id,
                'mp_entity_name': m.marketplace_entity.name,
            }
            for m in color_mappings
        ]

        # Страны
        country_mappings = CountryMapping.objects.filter(
            marketplace_entity__marketplace=marketplace,
        ).select_related('country', 'marketplace_entity')
        result['countries'] = [
            {
                'our_country_id': m.country_id,
                'our_country_name': m.country.name,
                'mp_entity_id': m.marketplace_entity_id,
                'mp_entity_external_id': m.marketplace_entity.external_id,
                'mp_entity_name': m.marketplace_entity.name,
            }
            for m in country_mappings
        ]

        # Размеры
        size_mappings = SizeMapping.objects.filter(
            marketplace_entity__marketplace=marketplace,
        ).select_related('size', 'marketplace_entity')
        result['sizes'] = [
            {
                'our_size_id': m.size_id,
                'our_size_name': str(m.size),
                'mp_entity_id': m.marketplace_entity_id,
                'mp_entity_external_id': m.marketplace_entity.external_id,
                'mp_entity_name': m.marketplace_entity.name,
            }
            for m in size_mappings
        ]

        return result

    def _export_attribute_sets(self, marketplace):
        sets = MarketplaceAttributeSet.objects.filter(
            marketplace=marketplace,
        ).prefetch_related('attributes', 'attributes__options')

        result = []
        for attr_set in sets:
            attrs = []
            for attr in attr_set.attributes.all():
                attr_data = {
                    'code': attr.external_code,
                    'name': attr.name,
                    'name_uk': attr.name_uk,
                    'type': attr.attr_type,
                    'is_required': attr.is_required,
                    'is_system': attr.is_system,
                    'group_name': attr.group_name,
                    'suffix': attr.suffix,
                }
                if attr.has_options:
                    attr_data['options'] = [
                        {
                            'code': opt.external_code,
                            'name': opt.name,
                            'name_uk': opt.name_uk,
                        }
                        for opt in attr.options.all()
                    ]
                attrs.append(attr_data)

            result.append({
                'code': attr_set.external_code,
                'name': attr_set.name,
                'name_uk': attr_set.name_uk,
                'category_id': attr_set.marketplace_category_id,
                'attributes_count': len(attrs),
                'required_count': sum(1 for a in attrs if a['is_required']),
                'attributes': attrs,
            })

        return result

    def _export_product_configs(self, marketplace):
        configs = ProductMarketplaceConfig.objects.filter(
            marketplace=marketplace,
        ).select_related('product', 'category_override')

        result = []
        for config in configs:
            attrs = ProductMarketplaceAttribute.objects.filter(
                product=config.product,
                marketplace_attribute__attribute_set__marketplace=marketplace,
            ).select_related('marketplace_attribute', 'value_option')

            result.append({
                'product_id': config.product_id,
                'product_name': config.product.name,
                'is_active': config.is_active,
                'custom_name': config.custom_name,
                'custom_name_uk': config.custom_name_uk,
                'category_override_id': config.category_override_id,
                'last_exported': str(config.last_exported) if config.last_exported else None,
                'attributes': [
                    {
                        'mp_attribute_code': a.marketplace_attribute.external_code,
                        'mp_attribute_name': a.marketplace_attribute.name,
                        'value': str(a.get_value()) if a.get_value() is not None else None,
                    }
                    for a in attrs
                ],
            })

        return result

    @action(detail=True, methods=['get'], url_path='full')
    def full_export(self, request, pk=None):
        """Полный экспорт конфигурации"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'export_version': '1.0',
            'marketplace': self._export_marketplace(marketplace),
            'category_mappings': self._export_category_mappings(marketplace),
            'attribute_mappings': self._export_attribute_mappings(marketplace),
            'entity_mappings': self._export_entity_mappings(marketplace),
            'attribute_sets': self._export_attribute_sets(marketplace),
            'product_configs': self._export_product_configs(marketplace),
        })

    @action(detail=True, methods=['get'], url_path='categories')
    def categories_export(self, request, pk=None):
        """Экспорт маппинга категорий"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'marketplace': marketplace.name,
            'category_mappings': self._export_category_mappings(marketplace),
        })

    @action(detail=True, methods=['get'], url_path='attribute-mappings')
    def attribute_mappings_export(self, request, pk=None):
        """Экспорт маппинга атрибутов"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'marketplace': marketplace.name,
            'attribute_mappings': self._export_attribute_mappings(marketplace),
        })

    @action(detail=True, methods=['get'], url_path='entity-mappings')
    def entity_mappings_export(self, request, pk=None):
        """Экспорт маппинга сущностей"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'marketplace': marketplace.name,
            'entity_mappings': self._export_entity_mappings(marketplace),
        })

    @action(detail=True, methods=['get'], url_path='attribute-sets')
    def attribute_sets_export(self, request, pk=None):
        """Экспорт наборов атрибутов"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'marketplace': marketplace.name,
            'attribute_sets': self._export_attribute_sets(marketplace),
        })

    @action(detail=True, methods=['get'], url_path='products')
    def products_export(self, request, pk=None):
        """Экспорт конфигурации товаров"""
        marketplace = self._get_marketplace(pk)
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'marketplace': marketplace.name,
            'product_configs': self._export_product_configs(marketplace),
        })
