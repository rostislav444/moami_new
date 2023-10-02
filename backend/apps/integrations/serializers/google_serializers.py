from rest_framework import serializers

from apps.product.models import Product, Variant
from project import settings


class TranslationFiled(serializers.Field):
    def bind(self, field_name, parent):
        super().bind(field_name, parent)

    def to_representation(self, value):
        language = self.context.get('language')
        if language is None:
            language = settings.LANGUAGE_CODE
        return value[language]


class GoogleVariantSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ('id', 'code', 'slug', 'images')

    def get_images(self, obj):
        request = self.context.get('request')
        if request:
            return [request.build_absolute_uri(image.image.url) for image in obj.images.all()]
        return [image.image.url for image in obj.images.all()]


class GoogleProductSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source='brand.name')
    name = TranslationFiled(source='get_translation__name')
    description = TranslationFiled(source='get_translation__description')
    google_product_category = serializers.CharField(source='category.google_taxonomy.name')

    variants = GoogleVariantSerializer(many=True)

    class Meta:
        model = Product
        fields = (
            'google_product_category',
            'brand',
            'name',
            'description',
            'variants',
            'price',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class GoogleProductByLanguageSerializer(serializers.ModelSerializer):
    languages = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('languages',)

    def get_languages(self, obj):
        data = []

        for language in settings.LANGUAGES:
            if language[0] == 'en':
                continue
            serializer = GoogleProductSerializer(obj)
            serializer.context.update({'language': language[0]})
            data.append({
                'language': language[0],
                'product': serializer.data
            })
        return data


__all__ = [
    'GoogleProductSerializer',
    'GoogleProductByLanguageSerializer'
]
