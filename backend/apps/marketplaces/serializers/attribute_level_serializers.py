from rest_framework import serializers
from apps.marketplaces.models import (
    MarketplaceAttributeLevel,
    MarketplaceAttribute,
    CategoryMapping,
    MarketplaceAttributeSet,
)


class MarketplaceAttributeLevelSerializer(serializers.ModelSerializer):
    """Сериализатор уровня атрибута"""
    attribute_name = serializers.CharField(source='marketplace_attribute.name', read_only=True)
    attribute_type = serializers.CharField(source='marketplace_attribute.attr_type', read_only=True)
    is_required = serializers.BooleanField(source='marketplace_attribute.is_required', read_only=True)

    class Meta:
        model = MarketplaceAttributeLevel
        fields = [
            'id', 'category_mapping', 'marketplace_attribute',
            'attribute_name', 'attribute_type', 'is_required',
            'level', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class AttributeConfigItemSerializer(serializers.Serializer):
    """Атрибут с текущим уровнем — для конфигурации категории"""
    mp_attribute_id = serializers.IntegerField()
    external_code = serializers.CharField()
    name = serializers.CharField()
    name_uk = serializers.CharField(allow_blank=True)
    attr_type = serializers.CharField()
    is_required = serializers.BooleanField()
    is_system = serializers.BooleanField()
    group_name = serializers.CharField(allow_blank=True)
    suffix = serializers.CharField(allow_blank=True)
    options_count = serializers.IntegerField()
    level = serializers.CharField(allow_null=True)  # текущий level или null
    level_id = serializers.IntegerField(allow_null=True)  # id записи MarketplaceAttributeLevel


class CategoryAttributeConfigSerializer(serializers.Serializer):
    """Полная конфигурация атрибутов для CategoryMapping"""
    category_mapping_id = serializers.IntegerField()
    our_category_id = serializers.IntegerField()
    our_category_name = serializers.CharField()
    mp_category_id = serializers.IntegerField()
    mp_category_name = serializers.CharField()
    mp_category_code = serializers.CharField()
    attribute_set_id = serializers.IntegerField(allow_null=True)
    attribute_set_name = serializers.CharField(allow_blank=True)
    total_attributes = serializers.IntegerField()
    configured_attributes = serializers.IntegerField()
    attributes = AttributeConfigItemSerializer(many=True)


class BulkAttributeLevelSerializer(serializers.Serializer):
    """Массовая установка уровней атрибутов"""
    category_mapping_id = serializers.IntegerField()
    levels = serializers.ListField(
        child=serializers.DictField(),
        help_text='[{"marketplace_attribute_id": 1, "level": "product"}, ...]'
    )

    def create(self, validated_data):
        category_mapping_id = validated_data['category_mapping_id']
        levels_data = validated_data['levels']

        created = []
        for item in levels_data:
            mp_attr_id = item.get('marketplace_attribute_id')
            level = item.get('level', 'product')

            if not mp_attr_id:
                continue

            obj, _ = MarketplaceAttributeLevel.objects.update_or_create(
                category_mapping_id=category_mapping_id,
                marketplace_attribute_id=mp_attr_id,
                defaults={'level': level}
            )
            created.append(obj)

        return created
