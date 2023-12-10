from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from apps.integrations.models import RozetkaCategories
from apps.product.models import Product, Variant, VariantSize, VariantImage, ProductComposition, ProductAttribute


class RozetkaCategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RozetkaCategories
        fields = ('id', 'name', 'parent_id', 'rozetka_id')


class ProductCompositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='composition.name')

    class Meta:
        model = ProductComposition
        fields = ('id', 'name', 'value')


class RozetkaVariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.CharField(source='get_size')
    full_id = serializers.SerializerMethodField()
    mk_full_id = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'full_id', 'mk_full_id', 'size', 'stock')

    @staticmethod
    def get_full_id(obj):
        return ' '.join([obj.variant.code, obj.get_size]).upper()

    @staticmethod
    def get_mk_full_id(obj):
        return '-'.join([obj.variant.code, obj.get_size]).upper()


class RozetkaVariantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('id', 'image')


class RozetkaVariantSerializer(serializers.ModelSerializer):
    sizes = RozetkaVariantSizeSerializer(many=True)
    images = RozetkaVariantImageSerializer(many=True)
    color = serializers.CharField(source='color.name')
    color_uk = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ('id', 'code', 'color', 'color_uk', 'sizes', 'images')

    def get_color_uk(self, obj):
        try:
            return obj.color.get_translation('name', 'uk')
        except:
            return obj.color.get_name


class RozetkaProductAttributesSerializer(serializers.ModelSerializer):
    attribute_group = serializers.CharField(source='attribute_group.name')
    attribute_group_uk = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    attributes_uk = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = ('id', 'attribute_group', 'attribute_group_uk', 'attributes', 'attributes_uk')

    def get_attribute_group_uk(self, obj):
        return getattr(obj.attribute_group, 'get_translation__name__uk')

    @staticmethod
    def get_attributes(obj):
        return obj.get_attribute_string_value()

    @staticmethod
    def get_attributes_uk(obj):
        return obj.get_attribute_string_value('uk')


class RozetkaProductSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    name_uk = serializers.SerializerMethodField()
    brand = serializers.CharField(source='brand.name')
    country = serializers.CharField(source='country.name')
    country_uk = serializers.CharField(source='country.get_translation__name__uk')
    category = serializers.CharField(source='category.name')
    description_uk = serializers.CharField(source='get_translation__description__uk')
    # Nested fields
    # rozetka_name_uk = serializers.CharField(source='get_translation__rozetka_name__uk')
    rozetka_category = RozetkaCategoriesSerializer()
    variants = RozetkaVariantSerializer(many=True)
    composition = serializers.SerializerMethodField()
    composition_uk = serializers.SerializerMethodField()
    attributes = RozetkaProductAttributesSerializer(many=True)
    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')

    class Meta:
        model = Product
        fields = (
            'id',
            'name', 'name_uk',
            'category',
            'brand',
            'country',
            'country_uk',
            'description',
            'description_uk',
            # 'rozetka_name',
            # 'rozetka_name_uk',
            'variants',
            'category',
            'price',
            'promo_price',
            'old_price',
            'composition',
            'composition_uk',
            'attributes',
            'preferred_size_grid',
            'rozetka_category'
        )

    def get_attributes(self):
        return []

    def get_name(self, obj):
        return obj.get_rozetka_name(lang_code='ru')

    def get_name_uk(self, obj):
        return obj.get_rozetka_name(lang_code='uk')

    def get_composition(self, obj):
        compositions = []
        for item in obj.compositions.all():
            value = str(item.value) + '% ' + item.composition.name
            compositions.append(value)
        return ', '.join(compositions)

    def get_composition_uk(self, obj):
        compositions = []
        for item in obj.compositions.all():
            value = str(item.value) + '% ' + item.composition.get_translation('name', 'uk')
            compositions.append(value)
        return ', '.join(compositions)


__all__ = [
    'RozetkaCategoriesSerializer',
    'ProductCompositionSerializer',
    'RozetkaVariantSizeSerializer',
    'RozetkaVariantImageSerializer',
    'RozetkaVariantSerializer',
    'RozetkaProductAttributesSerializer',
    'RozetkaProductSerializer'
]
