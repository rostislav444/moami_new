from rest_framework import serializers
from apps.marketplaces.models import (
    AttributeMapping,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
)
from apps.attributes.models import AttributeGroup, Attribute


class OurAttributeSerializer(serializers.ModelSerializer):
    """Сериализатор нашего атрибута (значения)"""

    class Meta:
        model = Attribute
        fields = ['id', 'name', 'slug', 'attribute_group']


class OurAttributeGroupSerializer(serializers.ModelSerializer):
    """Сериализатор нашей группы атрибутов"""
    attributes = OurAttributeSerializer(many=True, read_only=True)
    data_type = serializers.CharField(read_only=True)

    class Meta:
        model = AttributeGroup
        fields = ['id', 'name', 'slug', 'data_type', 'attributes']


class AttributeMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга атрибута (чтение)"""
    our_attribute_name = serializers.CharField(source='our_attribute.name', read_only=True)
    our_attribute_group_name = serializers.CharField(
        source='our_attribute.attribute_group.name', read_only=True
    )
    our_attribute_group_id = serializers.IntegerField(
        source='our_attribute.attribute_group.id', read_only=True
    )
    marketplace_attribute_name = serializers.CharField(
        source='marketplace_attribute.name', read_only=True
    )
    marketplace_attribute_type = serializers.CharField(
        source='marketplace_attribute.attr_type', read_only=True
    )
    marketplace_attribute_set_name = serializers.CharField(
        source='marketplace_attribute.attribute_set.name', read_only=True
    )
    marketplace_option_name = serializers.CharField(
        source='marketplace_option.name', read_only=True, default=None
    )
    marketplace_option_code = serializers.CharField(
        source='marketplace_option.external_code', read_only=True, default=None
    )

    class Meta:
        model = AttributeMapping
        fields = [
            'id',
            'our_attribute', 'our_attribute_name',
            'our_attribute_group_name', 'our_attribute_group_id',
            'marketplace_attribute', 'marketplace_attribute_name',
            'marketplace_attribute_type', 'marketplace_attribute_set_name',
            'marketplace_option', 'marketplace_option_name', 'marketplace_option_code',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class AttributeMappingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания маппинга атрибута"""

    class Meta:
        model = AttributeMapping
        fields = ['our_attribute', 'marketplace_attribute', 'marketplace_option']

    def validate(self, data):
        mp_attr = data['marketplace_attribute']
        mp_option = data.get('marketplace_option')

        if mp_option and not mp_attr.has_options:
            raise serializers.ValidationError(
                'Опция указана для атрибута без опций'
            )

        if mp_option and mp_option.attribute_id != mp_attr.id:
            raise serializers.ValidationError(
                'Опция не принадлежит указанному атрибуту'
            )

        return data


class BulkAttributeMappingSerializer(serializers.Serializer):
    """Сериализатор для массового создания маппингов атрибутов"""
    mappings = serializers.ListField(
        child=serializers.DictField(),
        help_text='[{"our_attribute": 1, "marketplace_attribute": 2, "marketplace_option": 3}]'
    )

    def create(self, validated_data):
        created = []
        for mapping_data in validated_data['mappings']:
            our_attribute_id = mapping_data.get('our_attribute')
            marketplace_attribute_id = mapping_data.get('marketplace_attribute')
            marketplace_option_id = mapping_data.get('marketplace_option')

            if not our_attribute_id or not marketplace_attribute_id:
                continue

            obj, _ = AttributeMapping.objects.update_or_create(
                our_attribute_id=our_attribute_id,
                marketplace_attribute_id=marketplace_attribute_id,
                defaults={
                    'marketplace_option_id': marketplace_option_id,
                }
            )
            created.append(obj)

        return created
