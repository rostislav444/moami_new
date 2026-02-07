from rest_framework import serializers
from apps.marketplaces.models import Marketplace


class MarketplaceListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка маркетплейсов"""
    categories_count = serializers.IntegerField(read_only=True)
    attribute_sets_count = serializers.IntegerField(read_only=True)
    mapped_categories_count = serializers.SerializerMethodField()

    class Meta:
        model = Marketplace
        fields = [
            'id', 'name', 'slug', 'integration_type', 'is_active',
            'last_sync', 'last_feed_generated',
            'categories_count', 'attribute_sets_count', 'mapped_categories_count'
        ]

    def get_mapped_categories_count(self, obj):
        from apps.marketplaces.models import CategoryMapping
        return CategoryMapping.objects.filter(
            marketplace_category__marketplace=obj
        ).count()


class MarketplaceSerializer(serializers.ModelSerializer):
    """Полный сериализатор маркетплейса"""
    categories_count = serializers.IntegerField(read_only=True)
    attribute_sets_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Marketplace
        fields = '__all__'
        read_only_fields = ['last_sync', 'last_feed_generated', 'created_at', 'updated_at']
