from rest_framework import serializers

from apps.integrations.serializers.serializers_variant import FeedVariantSerializer
from apps.product.models import Product
from apps.translation.serialziers import TranslationFiled
from project import settings


class GoogleProductSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source='brand.name')
    name = TranslationFiled(source='get_translation__name')
    description = TranslationFiled(source='get_translation__description')
    google_product_category = serializers.CharField(source='category.google_taxonomy.name')

    variants = FeedVariantSerializer(many=True)

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
