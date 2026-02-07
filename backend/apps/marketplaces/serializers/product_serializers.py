from rest_framework import serializers
from apps.marketplaces.models import (
    Marketplace,
    CategoryMapping,
    MarketplaceAttribute,
    ProductMarketplaceConfig,
    ProductMarketplaceAttribute,
)
from apps.product.models import Product


class ProductMarketplaceConfigSerializer(serializers.ModelSerializer):
    """Сериализатор настроек товара для маркетплейса"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)

    class Meta:
        model = ProductMarketplaceConfig
        fields = [
            'id', 'product', 'product_name', 'marketplace', 'marketplace_name',
            'is_active', 'custom_name', 'custom_name_uk',
            'custom_description', 'custom_description_uk',
            'category_override', 'last_exported', 'export_errors',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['last_exported', 'created_at', 'updated_at']


class ProductMarketplaceAttributeSerializer(serializers.ModelSerializer):
    """Сериализатор атрибута товара для маркетплейса"""
    attribute_name = serializers.CharField(
        source='marketplace_attribute.name', read_only=True
    )
    attribute_type = serializers.CharField(
        source='marketplace_attribute.attr_type', read_only=True
    )
    is_required = serializers.BooleanField(
        source='marketplace_attribute.is_required', read_only=True
    )
    value_display = serializers.SerializerMethodField()

    class Meta:
        model = ProductMarketplaceAttribute
        fields = [
            'id', 'product', 'marketplace_attribute',
            'attribute_name', 'attribute_type', 'is_required',
            'value_option', 'value_options',
            'value_string', 'value_string_uk',
            'value_text', 'value_text_uk',
            'value_int', 'value_float', 'value_boolean', 'value_json',
            'value_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_value_display(self, obj):
        value = obj.get_value()
        if value is None:
            return None
        if isinstance(value, list):
            return ', '.join([str(v) for v in value])
        return str(value)


class BulkProductAttributeSerializer(serializers.Serializer):
    """Сериализатор для массовой установки атрибутов товаров"""
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='Список ID товаров'
    )
    marketplace_id = serializers.IntegerField(help_text='ID маркетплейса')
    attributes = serializers.ListField(
        child=serializers.DictField(),
        help_text='Атрибуты: [{"attribute_id": 1, "value_option_id": 2}, ...]'
    )

    def create(self, validated_data):
        product_ids = validated_data.get('product_ids', [])
        marketplace_id = validated_data.get('marketplace_id')
        attributes = validated_data.get('attributes', [])

        created = []

        for product_id in product_ids:
            for attr_data in attributes:
                attribute_id = attr_data.get('attribute_id')
                if not attribute_id:
                    continue

                defaults = {}
                if 'value_option_id' in attr_data:
                    defaults['value_option_id'] = attr_data['value_option_id']
                if 'value_string' in attr_data:
                    defaults['value_string'] = attr_data['value_string']
                if 'value_int' in attr_data:
                    defaults['value_int'] = attr_data['value_int']
                if 'value_float' in attr_data:
                    defaults['value_float'] = attr_data['value_float']

                attr, _ = ProductMarketplaceAttribute.objects.update_or_create(
                    product_id=product_id,
                    marketplace_attribute_id=attribute_id,
                    defaults=defaults
                )
                created.append(attr)

        return created


class ProductExportStatusSerializer(serializers.ModelSerializer):
    """Сериализатор статуса готовности товара к экспорту"""
    marketplaces = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'marketplaces']

    def get_marketplaces(self, obj):
        result = []

        for marketplace in Marketplace.objects.filter(is_active=True):
            status = self._get_marketplace_status(obj, marketplace)
            result.append({
                'id': marketplace.id,
                'name': marketplace.name,
                'slug': marketplace.slug,
                **status
            })

        return result

    def _get_marketplace_status(self, product, marketplace):
        # Проверка маппинга категории
        category_mapping = CategoryMapping.objects.filter(
            category=product.category,
            marketplace_category__marketplace=marketplace,
            is_active=True
        ).first()

        category_mapped = category_mapping is not None

        # Проверка обязательных атрибутов
        missing_attrs = []
        filled_attrs = 0
        total_attrs = 0

        if category_mapping:
            required_attrs = MarketplaceAttribute.objects.filter(
                attribute_set__marketplace_category=category_mapping.marketplace_category,
                is_required=True
            )
            total_attrs = required_attrs.count()

            for attr in required_attrs:
                has_value = ProductMarketplaceAttribute.objects.filter(
                    product=product,
                    marketplace_attribute=attr
                ).exists()

                if has_value:
                    filled_attrs += 1
                else:
                    missing_attrs.append({
                        'id': attr.id,
                        'name': attr.name,
                        'type': attr.attr_type
                    })

        # Проверка конфига товара
        config = ProductMarketplaceConfig.objects.filter(
            product=product,
            marketplace=marketplace
        ).first()

        return {
            'ready': category_mapped and len(missing_attrs) == 0,
            'category_mapped': category_mapped,
            'category_mapping_id': category_mapping.id if category_mapping else None,
            'missing_required_attributes': missing_attrs,
            'filled_attributes': filled_attrs,
            'total_required_attributes': total_attrs,
            'is_active': config.is_active if config else True,
            'last_exported': config.last_exported if config else None,
        }
