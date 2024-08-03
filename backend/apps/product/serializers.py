from django.core.files.images import get_image_dimensions
from django.db.models import Sum
from rest_framework import serializers

from apps.categories.serializers import CategoryIdSerializer
from apps.product.models import Product, Variant, Color, VariantSize, VariantImage, CustomProperty, ProductComposition, \
    ProductAttribute, ProductComment, ProductCommentImage
from apps.sizes.serializers import SizeGridSerializer
from apps.user.serializers import UserSerializer
from project import settings


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


class ProductCompositionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='composition.name')

    class Meta:
        model = ProductComposition
        fields = ('id', 'name', 'value')


class VariantWithImagesSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    color = ColorSerializer()
    sizes = VariantSizeSerializer(many=True)

    class Meta:
        model = Variant
        fields = ('id', 'slug', 'image', 'color', 'code', 'sizes')

    def get_image(self, obj):
        image = obj.images.first()
        if image and 's' in image.thumbnails:
            thumb = settings.MEDIA_URL + image.thumbnails['s']
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(thumb)
        return None


class CustomPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomProperty
        fields = ('key', 'value')


class ProductCompositionSerializer(serializers.ModelSerializer):
    composition = serializers.CharField(source='composition.name')

    class Meta:
        model = ProductComposition
        fields = ('composition', 'value')


class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_group = serializers.CharField(source='attribute_group.name')
    attributes = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = ('attribute_group', 'attributes')

    def get_attributes(self, instance):
        return []


class ProductSerializer(serializers.ModelSerializer):
    variants = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    size_grids = SizeGridSerializer(source='category.size_group.grids', many=True)
    preferred_size_grid = serializers.CharField(source='get_preferred_size_grid')
    category = CategoryIdSerializer()

    # Properties
    compositions = ProductCompositionSerializer(many=True)
    properties = CustomPropertySerializer(many=True)
    attributes = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'price', 'old_price', 'description', 'extra_description', 'properties', 'variants',
            'breadcrumbs', 'size_grids', 'preferred_size_grid', 'category', 'compositions', 'properties', 'attributes',)

    def get_breadcrumbs(self, obj):
        breadcrumbs = []
        link = '/'
        for category in obj.category.get_ancestors(include_self=True):
            link += category.slug + '/'
            breadcrumbs.append({'title': category.name, 'link': link})
        return breadcrumbs

    def get_variants(self, obj):
        variants = obj.variants.filter(images__isnull=False, sizes__isnull=False).annotate(
            total_sizes=Sum('sizes__stock')).exclude(total_sizes=0).distinct()
        serializer = VariantWithImagesSerializer(variants, many=True)
        serializer.context.update(self.context)
        return serializer.data

    # TODO fix
    def get_attributes(self, instance):
        return []


class VariantImageThumbnailSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ('image',)


class VariantImageSerializer(serializers.ModelSerializer):
    thumbnails = serializers.SerializerMethodField()
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

    def get_thumbnails(self, obj):
        data = []
        request = self.context.get('request')
        if request and 'l' in obj.thumbnails.keys():
            for key, _ in VariantImage.THUMBNAILS_SIZES:
                url = settings.MEDIA_URL + obj.thumbnails[key]
                data.append({'image': request.build_absolute_uri(url)})
        return data


class VariantSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    name = serializers.SerializerMethodField()
    images = VariantImageSerializer(many=True)
    sizes = VariantSizeSerializer(many=True)
    color = serializers.CharField(source='color.name')
    slug = serializers.CharField(source='get_slug')
    product_video = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ['id', 'name', 'slug', 'code', 'product', 'images', 'sizes', 'color', 'product_video', 'video']
        extra_kwargs = {
            'url': {'lookup_field': 'slug'}
        }

    def get_name(self, obj):
        return obj.product.name + ' - ' + obj.color.name

    def get_video(self, obj):
        request = self.context.get('request')

        if request and hasattr(obj, 'video'):
            try:
                video_obj = obj.video
                if video_obj.video:
                    return request.build_absolute_uri(video_obj.video.url)
            except Variant.video.RelatedObjectDoesNotExist:
                return None

    def get_product_video(self, obj):
        request = self.context.get('request')

        if request and hasattr(obj.product, 'video'):
            try:
                video_obj = obj.product.video
                if video_obj.video:
                    return request.build_absolute_uri(video_obj.video.url)
            except Product.video.RelatedObjectDoesNotExist:
                return None
        return None


class ProductCommentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCommentImage
        fields = ('image',)


class ProductCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    images = ProductCommentImageSerializer(many=True, required=False)
    created_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M", read_only=True)

    class Meta:
        model = ProductComment
        fields = ('id', 'user', 'parent', 'product', 'rate', 'comment', 'images', 'created_at')
