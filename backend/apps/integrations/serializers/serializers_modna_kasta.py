from django.db.models import Q
from rest_framework import serializers

from apps.product.models import Variant


class ModnaKastaVariantDataSerializer(serializers.ModelSerializer):
    color = serializers.CharField(source='color.name')
    images = serializers.SerializerMethodField()
    name_ru = serializers.CharField(source='product.name')
    name_uk = serializers.CharField(source='product.get_translation__name__uk')
    brand = serializers.CharField(source='product.brand.name')
    description_ru = serializers.CharField(source='product.description')
    description_uk = serializers.CharField(source='product.get_translation__description__uk')
    composition_ru = serializers.CharField(source='get_composition')
    composition_uk = serializers.CharField(source='get_composition_uk')
    model = serializers.CharField(source='code')
    old_price = serializers.IntegerField(source='product.old_price')
    new_price = serializers.IntegerField(source='product.price')
    characteristics = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = (
            'color', 'images', 'name_ru', 'name_uk', 'brand', 'description_ru', 'description_uk', 'composition_ru',
            'composition_uk', 'model', 'code', 'old_price', 'new_price', 'characteristics',)

    @staticmethod
    def get_images(obj):
        images = list(obj.images.values_list('image', flat=True))[:9]
        domain = 'https://moami.com.ua/media/'
        return [domain + img for img in images]

    @staticmethod
    def get_characteristics(obj):
        product_attributes = obj.product.attributes.filter(
            Q(attribute_group__mk_key_name__isnull=False) &
            Q(
                Q(value_single_attribute__isnull=False) |
                Q(value_multi_attributes__isnull=False)
                # Q(value_int__isnull=False) |
                # Q(value_str__isnull=False)
            )
        )
        response = []

        for attr in product_attributes:
            data = {'key_name': attr.attribute_group.mk_key_name}
            value = attr.get_attribute_ids
            if isinstance(value, list):
                data['data'] = {"ids": value}
            else:
                data['value'] = value
            response.append(data)

        return response


class ModnaKastaProductSerializer(serializers.ModelSerializer):
    kind_id = serializers.IntegerField(source='product.category.modna_kast_category.kind_id')
    affiliation_id = serializers.IntegerField(source='product.category.modna_kast_category.affiliation_id')
    update = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ['kind_id', 'affiliation_id', 'update', 'data']

    @staticmethod
    def get_update(obj): return True

    @staticmethod
    def get_data(obj):
        response = []
        for size in obj.sizes.all():
            data = ModnaKastaVariantDataSerializer(obj).data
            data['code'] = size.sku
            # Color
            data['characteristics'].append({
                "data": {
                    "ids": [int(obj.color.mk_id)]
                },
                "key_name": "3"
            })
            # Size
            data['characteristics'].append({
                "data": {
                    "sizes": {
                        "kasta_size": int(size.size.mk_id)
                    }
                },
                "key_name": "kasta_size"
            })
            data['size'] = size.get_size
            data['stock'] = size.stock
            response.append(data)

        return response


