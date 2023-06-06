from django.core.files.images import get_image_dimensions
from rest_framework import serializers

from apps.product.models import Product, Variant, Color, VariantSize, VariantImage, CustomProperty
from apps.sizes.serializers import SizeGridSerializer


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ('id', 'name', 'code')


class VariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'size', 'stock')

    def get_size(self, obj):
        return obj.size.get_interpretations_dict()


class VariantWithImagesSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    color = ColorSerializer()
    sizes = VariantSizeSerializer(many=True)

    class Meta:
        model = Variant
        fields = ('id', 'slug', 'image', 'color', 'code', 'sizes')

    def get_image(self, obj):
        image = obj.images.first()
        if image:
            thumb = image.thumbnails.filter(size='thumbnail').first()
            if thumb:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(thumb.image.url)
        return None


class CustomPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomProperty
        fields = ('key', 'value')


class ProductSerializer(serializers.ModelSerializer):
    variants = VariantWithImagesSerializer(many=True)
    breadcrumbs = serializers.SerializerMethodField()
    properties = CustomPropertySerializer(many=True)
    size_grids = SizeGridSerializer(source='category.size_group.grids', many=True)

    class Meta:
        model = Product
        fields = ('name', 'slug', 'price', 'old_price', 'description', 'properties', 'variants', 'breadcrumbs',
                  'size_grids', 'product_preferred_size_grid')

    def get_breadcrumbs(self, obj):
        breadcrumbs = []
        link = '/'
        for category in obj.category.get_ancestors(include_self=True):
            link += category.slug + '/'
            breadcrumbs.append({'title': category.name, 'link': link})
        return breadcrumbs


class VariantImageThumbnailSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('image',)


class VariantImageSerializer(serializers.ModelSerializer):
    thumbnails = VariantImageThumbnailSerializer(many=True)
    dimensions = serializers.SerializerMethodField()

    class Meta:
        model = VariantImage
        fields = ('image', 'dimensions', 'thumbnails')

    @staticmethod
    def get_dimensions(obj):
        try:
            w, h = get_image_dimensions(obj.image.file)
            return {'width': w, 'height': h}
        except FileNotFoundError:
            return None


class VariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    name = serializers.SerializerMethodField()
    images = VariantImageSerializer(many=True)
    sizes = VariantSizeSerializer(many=True)
    color = serializers.CharField(source='color.name')

    class Meta:
        model = Variant
        fields = ['id', 'name', 'slug', 'code', 'product', 'images', 'sizes', 'color']
        extra_kwargs = {
            'url': {'lookup_field': 'slug'}
        }

    def get_name(self, obj):
        return obj.product.name + ' - ' + obj.color.name
