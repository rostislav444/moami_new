from django.conf import settings
from rest_framework import serializers

from apps.product.models import Product, Variant, Color, VariantImage, VariantSize
from apps.product.serializers import VariantSizeSerializer


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'old_price')


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ('id', 'name', 'code')


class CatalogueImageSerializer(serializers.ModelSerializer):
    """Lightweight image serializer for catalogue with thumbnail for progressive loading"""
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = VariantImage
        fields = ('image', 'thumbnail')

    def get_thumbnail(self, obj):
        if obj.thumbnails and 'xs' in obj.thumbnails:
            return settings.MEDIA_URL + obj.thumbnails['xs']
        return None


class CatalogueVariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    color = ColorSerializer()
    images = CatalogueImageSerializer(many=True)
    sizes = VariantSizeSerializer(many=True)
    slug = serializers.CharField(source='get_slug', read_only=True)

    class Meta:
        model = Variant
        fields = ('id', 'slug', 'product', 'code', 'color', 'images', 'sizes')
