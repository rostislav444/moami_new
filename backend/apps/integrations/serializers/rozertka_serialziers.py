from django.core.exceptions import ObjectDoesNotExist
from django.utils.text import slugify
from rest_framework import serializers

from apps.integrations.models import RozetkaCategories
from apps.product.models import Product, Variant, VariantSize, VariantImage, ProductComposition, ProductAttribute


class RozetkaCategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = RozetkaCategories
        fields = ('id', 'name', 'parent_id', 'rozetka_id')


class RozetkaProductCompositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='composition.name')

    class Meta:
        model = ProductComposition
        fields = ('id', 'name', 'value')


class RozetkaVariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.CharField(source='get_size')
    full_id = serializers.SerializerMethodField()
    full_id_slugified = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'full_id', 'full_id_slugified', 'size', 'stock')

    @staticmethod
    def get_full_id(obj):
        full_id = obj.variant.code + ' ' + obj.get_size
        return full_id.upper()

    @staticmethod
    def get_full_id_slugified(obj):
        full_id = obj.variant.code + '-' + obj.get_size
        return slugify(full_id)


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
            return obj.color.translations.get(language_code='uk').name
        except ObjectDoesNotExist:
            return obj.color.name


class RozetkaFeedProductSerializer(serializers.ModelSerializer):
    attribute_group = serializers.CharField(source='attribute_group.name')
    attribute_group_uk = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    attributes_uk = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = ('id', 'attribute_group', 'attribute_group_uk', 'attributes', 'attributes_uk')

    def get_attribute_group_uk(self, obj):
        try:
            return obj.attribute_group.translations.get(language_code='uk').name
        except ObjectDoesNotExist:
            return obj.attribute_group.name

    def get_attributes(self, obj):
        attributes = []
        for attr in obj.attributes.all():
            attributes.append(attr.name)
        return ', '.join(attributes)

    def get_attributes_uk(self, obj):
        attributes = []
        for attr in obj.attributes.all():
            try:
                attributes.append(attr.translations.get(language_code='uk').name)
            except ObjectDoesNotExist:
                attributes.append(attr.name)
        return ', '.join(attributes)


class RozetkaProductSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source='brand.name')
    country = serializers.CharField(source='country.name')
    country_uk = serializers.SerializerMethodField()

    category = serializers.CharField(source='category.name')
    # Method fields
    name_uk = serializers.SerializerMethodField()
    description_uk = serializers.SerializerMethodField()
    # Nested fields
    rozetka_category = RozetkaCategoriesSerializer()
    variants = RozetkaVariantSerializer(many=True)
    composition = serializers.SerializerMethodField()
    composition_uk = serializers.SerializerMethodField()
    attributes = RozetkaFeedProductSerializer(many=True)

    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')

    class Meta:
        model = Product
        fields = (
            'id',
            'name', 'name_uk',
            'category',
            'brand',
            'country', 'country_uk',
            'description', 'description_uk',
            'variants',
            'category',
            'price',
            'promo_price',
            'old_price',
            'composition', 'composition_uk',
            'attributes',
            'preferred_size_grid',
            'rozetka_category'
        )

    def get_country_uk(self, obj):
        try:
            return obj.country.translations.get(language_code='uk').name
        except ObjectDoesNotExist:
            return obj.country.name

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

    def get_composition(self, obj):
        compositions = []
        for item in obj.compositions.all():
            str(item.value) + '% ' + item.composition.name
        return ', '.join(compositions)

    def get_composition_uk(self, obj):
        compositions = []
        for item in obj.compositions.all():
            try:
                compositions.append(str(item.value) + '% ' + item.composition.translations.get(language_code='uk').name)
            except ObjectDoesNotExist:
                compositions.append(str(item.value) + '% ' + item.composition.name)
        return ', '.join(compositions)



__all__ = [
    'RozetkaCategoriesSerializer',
    'RozetkaProductCompositionSerializer',
    'RozetkaVariantSizeSerializer',
    'RozetkaVariantImageSerializer',
    'RozetkaVariantSerializer',
    'RozetkaFeedProductSerializer',
    'RozetkaProductSerializer'
]