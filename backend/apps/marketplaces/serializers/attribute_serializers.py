from rest_framework import serializers
from apps.marketplaces.models import (
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
)


def get_shared_options_count(attr):
    """Get options count: own or shared via external_code"""
    if not attr.has_options:
        return 0
    own = attr.options.count()
    if own > 0:
        return own
    # Fallback: sibling with same external_code
    return MarketplaceAttributeOption.objects.filter(
        attribute__external_code=attr.external_code,
        attribute__attribute_set__marketplace=attr.attribute_set.marketplace,
    ).values('external_code').distinct().count()


class MarketplaceAttributeOptionSerializer(serializers.ModelSerializer):
    """Сериализатор опции атрибута"""

    class Meta:
        model = MarketplaceAttributeOption
        fields = ['id', 'external_code', 'name', 'name_uk']


class MarketplaceAttributeSerializer(serializers.ModelSerializer):
    """Сериализатор атрибута"""
    options = serializers.SerializerMethodField()
    options_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceAttribute
        fields = [
            'id', 'external_code', 'name', 'name_uk', 'attr_type',
            'is_required', 'is_system', 'group_name', 'group_code',
            'suffix', 'extra_data', 'options', 'options_count'
        ]

    def get_options(self, obj):
        if not obj.has_options:
            return []
        qs = obj.options.all()
        if not qs.exists():
            # Shared options from sibling
            qs = MarketplaceAttributeOption.objects.filter(
                attribute__external_code=obj.external_code,
                attribute__attribute_set__marketplace=obj.attribute_set.marketplace,
            ).order_by('name')
        return MarketplaceAttributeOptionSerializer(qs, many=True).data

    def get_options_count(self, obj):
        return get_shared_options_count(obj)


class MarketplaceAttributeListSerializer(serializers.ModelSerializer):
    """Краткий сериализатор атрибута для списков"""
    options_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceAttribute
        fields = [
            'id', 'external_code', 'name', 'attr_type',
            'is_required', 'is_system', 'options_count'
        ]

    def get_options_count(self, obj):
        return get_shared_options_count(obj)


class MarketplaceAttributeSetListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for attribute set listings (no nested attributes)"""
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)

    class Meta:
        model = MarketplaceAttributeSet
        fields = [
            'id', 'external_code', 'name', 'name_uk',
            'marketplace', 'marketplace_name', 'marketplace_category',
            'attributes_count',
        ]


class MarketplaceAttributeSetSerializer(serializers.ModelSerializer):
    """Full serializer with nested attributes (for detail view)"""
    attributes = MarketplaceAttributeListSerializer(many=True, read_only=True)
    attributes_count = serializers.IntegerField(read_only=True)
    required_attributes_count = serializers.IntegerField(read_only=True)
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)

    class Meta:
        model = MarketplaceAttributeSet
        fields = [
            'id', 'external_code', 'name', 'name_uk',
            'marketplace', 'marketplace_name', 'marketplace_category',
            'attributes', 'attributes_count', 'required_attributes_count'
        ]
