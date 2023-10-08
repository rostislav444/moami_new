from rest_framework import serializers

from apps.integrations.serializers.variant_serializer import FeedVariantSerializer
from apps.product.models import Product
from apps.translation.serialziers import TranslationFiled
from project import settings


class FacebookVariantSerializer(FeedVariantSerializer):
    video = serializers.SerializerMethodField()

    class Meta:
        model = FeedVariantSerializer.Meta.model
        fields = FeedVariantSerializer.Meta.fields + ('video',)

    def get_video(self, obj):
        request = self.context.get('request')

        if request:
            if hasattr(obj, 'video') and obj.video.video:
                return request.build_absolute_uri(obj.video.video.url)
        return None


class FacebookProductSerializer(serializers.ModelSerializer):
    collections = serializers.SerializerMethodField()
    google_product_category = serializers.CharField(source='category.google_taxonomy.name')
    facebook_product_category = serializers.CharField(source='category.facebook_category.facebook_id')
    brand = serializers.CharField(source='brand.name')
    name = TranslationFiled(source='get_translation__name')
    description = TranslationFiled(source='get_translation__description')
    variants = FacebookVariantSerializer(many=True)
    material = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'collections',
            'google_product_category',
            'facebook_product_category',
            'brand',
            'name',
            'slug',
            'description',
            'variants',
            'price',
            'old_price',
            'material',
            'video'
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def get_collections(self, obj):
        return obj.collections.all().values_list('name', flat=True)[:5]

    def get_material(self, obj):
        return ', '.join(
            [f'{composition.composition.name} {str(composition.value)}%' for composition in obj.compositions.all()])

    def get_video(self, obj):
        request = self.context.get('request')

        if request:
            if hasattr(obj, 'video') and obj.video.video:
                return request.build_absolute_uri(obj.video.video.url)
        return None


class FacebookProductByLanguageSerializer(serializers.ModelSerializer):
    languages = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('languages',)

    def get_languages(self, obj):
        data = []

        for language in settings.LANGUAGES:
            if language[0] == 'en':
                continue
            serializer = FacebookProductSerializer(obj)
            serializer.context.update({
                **self.context,
                'language': language[0],
            })
            data.append({
                'language': language[0],
                'product': serializer.data
            })
        return data
