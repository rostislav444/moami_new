from rest_framework import serializers
from apps.marketplaces.models import (
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
)


class MarketplaceAttributeOptionSerializer(serializers.ModelSerializer):
    """Сериализатор опции атрибута"""

    class Meta:
        model = MarketplaceAttributeOption
        fields = ['id', 'external_code', 'name', 'name_uk']


class MarketplaceAttributeSerializer(serializers.ModelSerializer):
    """Сериализатор атрибута"""
    options = MarketplaceAttributeOptionSerializer(many=True, read_only=True)
    options_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceAttribute
        fields = [
            'id', 'external_code', 'name', 'name_uk', 'attr_type',
            'is_required', 'is_system', 'group_name', 'group_code',
            'suffix', 'extra_data', 'options', 'options_count'
        ]

    def get_options_count(self, obj):
        if obj.has_options:
            return obj.options.count()
        return 0


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
        if obj.has_options:
            return obj.options.count()
        return 0


class MarketplaceAttributeSetSerializer(serializers.ModelSerializer):
    """Сериализатор набора атрибутов"""
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
