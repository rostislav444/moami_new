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
    """Lightweight image serializer for catalogue - no expensive file I/O operations"""
    class Meta:
        model = VariantImage
        fields = ('image',)


class CatalogueVariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    color = ColorSerializer()
    images = CatalogueImageSerializer(many=True)
    sizes = VariantSizeSerializer(many=True)
    slug = serializers.CharField(source='get_slug', read_only=True)

    class Meta:
        model = Variant
        fields = ('id', 'slug', 'product', 'code', 'color', 'images', 'sizes')
