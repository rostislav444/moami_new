from rest_framework import serializers

from apps.product.models import Variant


class FeedVariantSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    color = serializers.CharField(source='color.name')
    code_slug = serializers.CharField(source='get_code_slug')

    class Meta:
        model = Variant
        fields = ('id', 'code', 'slug', 'images', 'color', 'code_slug')

    def get_images(self, obj):
        request = self.context.get('request')
        if request:
            return [request.build_absolute_uri(image.image.url) for image in obj.images.all()]
        return [image.image.url for image in obj.images.all()]


__all__ = [
    'FeedVariantSerializer',
]
