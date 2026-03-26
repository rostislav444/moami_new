from rest_framework import serializers
from apps.marketplaces.models import (
    MarketplaceEntity,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
)


class MarketplaceEntitySerializer(serializers.ModelSerializer):
    """Сериализатор сущности маркетплейса"""

    class Meta:
        model = MarketplaceEntity
        fields = [
            'id', 'marketplace', 'entity_type',
            'external_id', 'external_code', 'name', 'name_uk',
        ]


class BrandMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга бренда"""
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    entity_name = serializers.CharField(source='marketplace_entity.name', read_only=True)
    entity_external_id = serializers.CharField(
        source='marketplace_entity.external_id', read_only=True
    )

    class Meta:
        model = BrandMapping
        fields = [
            'id', 'brand', 'brand_name',
            'marketplace_entity', 'entity_name', 'entity_external_id',
            'created_at',
        ]
        read_only_fields = ['created_at']


class ColorMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга цвета"""
    color_name = serializers.CharField(source='color.name', read_only=True)
    entity_name = serializers.CharField(source='marketplace_entity.name', read_only=True)
    entity_external_id = serializers.CharField(
        source='marketplace_entity.external_id', read_only=True
    )

    class Meta:
        model = ColorMapping
        fields = [
            'id', 'color', 'color_name',
            'marketplace_entity', 'entity_name', 'entity_external_id',
            'created_at',
        ]
        read_only_fields = ['created_at']


class CountryMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга страны"""
    country_name = serializers.CharField(source='country.name', read_only=True)
    entity_name = serializers.CharField(source='marketplace_entity.name', read_only=True)
    entity_external_id = serializers.CharField(
        source='marketplace_entity.external_id', read_only=True
    )

    class Meta:
        model = CountryMapping
        fields = [
            'id', 'country', 'country_name',
            'marketplace_entity', 'entity_name', 'entity_external_id',
            'created_at',
        ]
        read_only_fields = ['created_at']


class SizeMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга размера"""
    size_name = serializers.SerializerMethodField()
    entity_name = serializers.CharField(source='marketplace_entity.name', read_only=True)
    entity_external_id = serializers.CharField(
        source='marketplace_entity.external_id', read_only=True
    )

    class Meta:
        model = SizeMapping
        fields = [
            'id', 'size', 'size_name',
            'marketplace_entity', 'entity_name', 'entity_external_id',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def get_size_name(self, obj):
        return str(obj.size)
