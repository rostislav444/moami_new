from rest_framework import serializers

from apps.integrations.serializers.serializers_rozetka import RozetkaCategoriesSerializer
from apps.product.models import Product, Variant, VariantSize, VariantImage, ProductAttribute


class ModnaKastaXMLVariantSizeSerializer(serializers.ModelSerializer):
    size = serializers.SerializerMethodField()
    full_id = serializers.SerializerMethodField()

    class Meta:
        model = VariantSize
        fields = ('id', 'full_id', 'size', 'stock')

    @staticmethod
    def get_full_id(obj):
        return '-'.join([obj.variant.code, obj.get_size]).upper()

    def get_size(self, obj):
        size = obj.get_size
        if size == 'One size':
            return 'S-L'
        return size


class ModnaKastaXMLVariantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('id', 'image')


class ModnaKastaXMLVariantSerializer(serializers.ModelSerializer):
    sizes = ModnaKastaXMLVariantSizeSerializer(many=True)
    images = ModnaKastaXMLVariantImageSerializer(many=True)
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


class ModnaKastaXMLProductAttributesSerializer(serializers.ModelSerializer):
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


class ModnaKastaXMLProductSerializer(serializers.ModelSerializer):
    name_uk = serializers.CharField(source='get_translation__name__uk')
    brand = serializers.CharField(source='brand.name')
    country = serializers.CharField(source='country.name')
    country_uk = serializers.CharField(source='country.get_translation__name__uk')
    category = RozetkaCategoriesSerializer(source='rozetka_category')
    description_uk = serializers.CharField(source='get_translation__description__uk')
    variants = ModnaKastaXMLVariantSerializer(many=True)
    composition = serializers.SerializerMethodField()
    composition_uk = serializers.SerializerMethodField()
    attributes = ModnaKastaXMLProductAttributesSerializer(many=True)
    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')

    class Meta:
        model = Product
        fields = ('id', 'name', 'name_uk', 'category', 'brand', 'country', 'country_uk', 'description',
                  'description_uk', 'variants', 'category', 'price', 'promo_price', 'old_price', 'composition',
                  'composition_uk', 'attributes', 'preferred_size_grid', 'rozetka_category')

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
            tr = item.composition.translations.filter(language_code='uk')
            if tr.count() > 0:
                name = tr.name
            else:
                name = item.composition.name

            value = str(item.value) + '% ' + name
            compositions.append(value)
        return ', '.join(compositions)


__all__ = [
    'ModnaKastaXMLVariantSizeSerializer',
    'ModnaKastaXMLVariantImageSerializer',
    'ModnaKastaXMLVariantSerializer',
    'ModnaKastaXMLProductAttributesSerializer',
    'ModnaKastaXMLProductSerializer'
]
