from rest_framework import serializers

from apps.integrations.models import RozetkaCategories
from apps.product.models import Product, Variant, VariantSize, VariantImage, ProductComposition, ProductAttribute

from django.core.exceptions import ObjectDoesNotExist


class RozetkaCategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RozetkaCategories
        fields = ('id', 'name', 'parent_id', 'rozetka_id')


class ProductCompositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='composition.name')

    class Meta:
        model = ProductComposition
        fields = ('id', 'name', 'value')


class FeedVariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.CharField(source='get_size')
    full_id = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'full_id', 'size', 'stock')

    @staticmethod
    def get_full_id(obj):
        full_id = obj.variant.code + ' ' + obj.get_size
        return full_id.upper()


class FeedVariantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('id', 'image')


class FeedVariantSerializer(serializers.ModelSerializer):
    sizes = FeedVariantSizeSerializer(many=True)
    images = FeedVariantImageSerializer(many=True)
    color = serializers.CharField(source='color.name')
    color_uk = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ('id', 'code', 'color', 'color_uk', 'sizes', 'images')

    def get_color_uk(self, obj):
        try:
            return obj.color.translations.get(language_code='uk').name
        except ObjectDoesNotExist:
            return obj.color.name


class FeedProductAttributeSerializer(serializers.ModelSerializer):
    attribute_group = serializers.CharField(source='attribute_group.name')
    attributes = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = ('id', 'attribute_group', 'attributes',)

    def get_attributes(self, obj):
        return ', '.join(obj.attributes.all().values_list('name', flat=True))


class FeedProductSerializer(serializers.ModelSerializer):
    category = RozetkaCategoriesSerializer(source='rozetka_category')
    variants = FeedVariantSerializer(many=True)
    brand = serializers.CharField(source='brand.name')
    country = serializers.CharField(source='country.name')
    name_uk = serializers.SerializerMethodField()
    description_uk = serializers.SerializerMethodField()
    compositions = ProductCompositionSerializer(many=True)
    attributes = FeedProductAttributeSerializer(many=True)
    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')

    class Meta:
        model = Product
        fields = ('id', 'name', 'name_uk', 'brand', 'country', 'description', 'description_uk', 'variants', 'category',
                  'price', 'old_price', 'compositions', 'attributes', 'preferred_size_grid')

    def get_name_uk(self, obj):
        try:
            return obj.translations.get(language_code='uk').name
        except ObjectDoesNotExist:
            return obj.name

    def get_description_uk(self, obj):
        try:
            return obj.translations.get(language_code='uk').description
        except ObjectDoesNotExist:
            return obj.description
