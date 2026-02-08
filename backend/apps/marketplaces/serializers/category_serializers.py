from rest_framework import serializers
from apps.marketplaces.models import MarketplaceCategory, CategoryMapping


class MarketplaceCategorySerializer(serializers.ModelSerializer):
    """Сериализатор категории маркетплейса"""

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'external_id', 'external_code', 'name', 'name_uk',
            'full_path', 'has_children', 'is_active', 'extra_data',
            'parent', 'level', 'marketplace'
        ]


class MarketplaceCategoryWriteSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/редактирования категории маркетплейса"""

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'marketplace', 'external_id', 'external_code',
            'name', 'name_uk', 'parent', 'is_active', 'extra_data'
        ]

    def create(self, validated_data):
        import uuid
        # Генерируем external_id если не указан
        if not validated_data.get('external_id'):
            validated_data['external_id'] = f"manual_{uuid.uuid4().hex[:8]}"
        # Копируем external_id в external_code если не указан
        if not validated_data.get('external_code'):
            validated_data['external_code'] = validated_data['external_id']
        return super().create(validated_data)


class MarketplaceCategoryTreeSerializer(serializers.ModelSerializer):
    """Сериализатор дерева категорий"""
    children = serializers.SerializerMethodField()
    mapping = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceCategory
        fields = [
            'id', 'external_id', 'external_code', 'name', 'name_uk',
            'has_children', 'is_active', 'children', 'mapping'
        ]

    def get_children(self, obj):
        children = obj.get_children()
        return MarketplaceCategoryTreeSerializer(children, many=True).data

    def get_mapping(self, obj):
        mapping = obj.mappings.select_related('category').first()
        if mapping:
            return {
                'id': mapping.id,
                'category_id': mapping.category_id,
                'category_name': mapping.category.name,
                'is_active': mapping.is_active,
            }
        return None


class CategoryMappingSerializer(serializers.ModelSerializer):
    """Сериализатор маппинга категорий"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    marketplace_category_name = serializers.CharField(
        source='marketplace_category.name', read_only=True
    )
    marketplace_name = serializers.CharField(
        source='marketplace_category.marketplace.name', read_only=True
    )

    class Meta:
        model = CategoryMapping
        fields = [
            'id', 'category', 'category_name',
            'marketplace_category', 'marketplace_category_name',
            'marketplace_name', 'is_active', 'custom_name',
            'created_at', 'updated_at'
        ]


class CategoryMappingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания маппинга категорий"""

    class Meta:
        model = CategoryMapping
        fields = ['category', 'marketplace_category', 'is_active', 'custom_name']


class BulkCategoryMappingSerializer(serializers.Serializer):
    """Сериализатор для массового создания маппингов"""
    mappings = serializers.ListField(
        child=serializers.DictField(),
        help_text='Список маппингов: [{"category_id": 1, "marketplace_category_id": 2}, ...]'
    )

    def create(self, validated_data):
        mappings = validated_data.get('mappings', [])
        created = []

        for mapping_data in mappings:
            category_id = mapping_data.get('category_id')
            marketplace_category_id = mapping_data.get('marketplace_category_id')

            if category_id and marketplace_category_id:
                mapping, _ = CategoryMapping.objects.get_or_create(
                    category_id=category_id,
                    marketplace_category_id=marketplace_category_id,
                    defaults={'is_active': True}
                )
                created.append(mapping)

        return created
