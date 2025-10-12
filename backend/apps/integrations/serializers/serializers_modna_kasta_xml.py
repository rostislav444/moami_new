import re

from rest_framework import serializers

from apps.integrations.serializers.serializers_rozetka import RozetkaCategoriesSerializer
from apps.product.models import Product, Variant, VariantSize, VariantImage, ProductAttribute


NUMERIC_SIZE_PATTERN = re.compile(r'^[0-9.,/\-]+$')


class ModnaKastaXMLVariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.SerializerMethodField()
    max_size = serializers.SerializerMethodField()
    full_id = serializers.SerializerMethodField()
    mk_full_id = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'full_id', 'mk_full_id', 'size', 'stock', 'max_size')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._append_cm_cache = {}

    @staticmethod
    def get_full_id(obj):
        return ' '.join([obj.variant.code, obj.get_size]).upper()

    @staticmethod
    def get_mk_full_id(obj):
        return '-'.join([obj.variant.get_effective_code, obj.get_size]).upper()

    def get_size(self, obj):
        size = obj.get_size
        return self._format_size(size, obj)

    def get_max_size(self, obj):
        size = obj.get_max_size
        return self._format_size(size, obj) if size else size

    def _format_size(self, size_value, obj):
        if not size_value:
            return size_value

        normalized = size_value.strip()
        if normalized.lower().endswith('см'):
            return normalized

        if not self._should_append_cm(obj):
            return normalized

        if not NUMERIC_SIZE_PATTERN.match(normalized.replace(' ', '')):
            return normalized

        return f'{normalized}см'

    def _should_append_cm(self, obj):
        product = getattr(obj.variant, 'product', None)
        if not product:
            return False

        category = getattr(product, 'category', None)
        if not category:
            return False

        category_id = getattr(category, 'id', None)
        if category_id in self._append_cm_cache:
            return self._append_cm_cache[category_id]

        should_append = False
        current_category = category

        while current_category:
            if getattr(current_category, 'mk_append_cm', False):
                should_append = True
                break
            current_category = getattr(current_category, 'parent', None)

        if category_id is not None:
            self._append_cm_cache[category_id] = should_append

        return should_append


class ModnaKastaXMLVariantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('id', 'image')


class ModnaKastaXMLVariantSerializer(serializers.ModelSerializer):
    sizes = ModnaKastaXMLVariantSizeSerializer(many=True)
    images = ModnaKastaXMLVariantImageSerializer(many=True)
    color = serializers.CharField(source='color.name')
    color_uk = serializers.SerializerMethodField()
    code = serializers.SerializerMethodField()
    article_code = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ('id', 'code', 'article_code', 'color', 'color_uk', 'sizes', 'images')

    def get_code(self, obj):
        return obj.get_effective_code

    def get_color_uk(self, obj):
        return obj.color.get_translation__name__uk

    @staticmethod
    def get_article_code(obj):
        return obj.code


class ModnaKastaXMLProductAttributesSerializer(serializers.ModelSerializer):
    attribute_group = serializers.CharField(source='attribute_group.name')
    attribute_group_uk = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    attributes_uk = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = ('id', 'attribute_group', 'attribute_group_uk', 'attributes', 'attributes_uk')

    @staticmethod
    def get_attribute_group_uk(obj):
        return obj.attribute_group.get_translation('name', 'uk')

    @staticmethod
    def get_attributes(obj):
        return obj.get_attribute_string_value()

    @staticmethod
    def get_attributes_uk(obj):
        return obj.get_attribute_string_value('uk')


class ModnaKastaXMLProductSerializer(serializers.ModelSerializer):
    name_uk = serializers.CharField(source='get_translation__name__uk')
    brand = serializers.CharField(source='brand.name')
    country = serializers.CharField(source='country.name')
    country_uk = serializers.CharField(source='country.get_translation__name__uk')
    mk_category = serializers.CharField(source='category.modna_kast_category.name')
    category = RozetkaCategoriesSerializer(source='rozetka_category')
    description_uk = serializers.CharField(source='get_translation__description__uk')
    variants = ModnaKastaXMLVariantSerializer(many=True)
    composition = serializers.SerializerMethodField()
    composition_uk = serializers.SerializerMethodField()
    attributes = ModnaKastaXMLProductAttributesSerializer(many=True)
    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')
    product_code = serializers.CharField(source='get_product_code')

    class Meta:
        model = Product
        fields = ('id', 'name', 'name_uk', 'category', 'brand', 'country', 'country_uk', 'mk_category', 'description',
                  'description_uk', 'variants', 'category', 'price', 'promo_price', 'old_price', 'composition',
                  'composition_uk', 'attributes', 'preferred_size_grid', 'rozetka_category', 'product_code')

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
    'ModnaKastaXMLVariantSizeSerializer',
    'ModnaKastaXMLVariantImageSerializer',
    'ModnaKastaXMLVariantSerializer',
    'ModnaKastaXMLProductAttributesSerializer',
    'ModnaKastaXMLProductSerializer'
]
