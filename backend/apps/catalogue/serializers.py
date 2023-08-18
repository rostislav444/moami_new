from rest_framework import serializers

from apps.product.models import Product, Variant, Color
from apps.product.serializers import VariantImageSerializer, VariantSizeSerializer


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'old_price')


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ('id', 'name', 'code')


class CatalogueVariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    color = ColorSerializer()
    images = VariantImageSerializer(many=True)
    sizes = VariantSizeSerializer(many=True)
    slug = serializers.CharField(source='get_slug', read_only=True)

    class Meta:
        model = Variant
        fields = ('id', 'slug', 'product', 'code', 'color', 'images', 'sizes')

    def get_color(self, obj):
        return obj.color.name

    def get_images(self, obj):
        return obj.images.values_list('image', flat=True)

    def get_sizes(self, obj):
        return VariantSizeSerializer(obj.sizes.all(), many=True).data
