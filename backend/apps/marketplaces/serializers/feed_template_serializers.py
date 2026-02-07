from rest_framework import serializers
from apps.marketplaces.models import FeedTemplate


class FeedTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedTemplate
        fields = [
            'id',
            'marketplace',
            'name',
            'template_type',
            'content',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class FeedPreviewSerializer(serializers.Serializer):
    marketplace_id = serializers.IntegerField()
    product_id = serializers.IntegerField(required=False)
