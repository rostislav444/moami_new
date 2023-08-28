from rest_framework import serializers

from apps.categories.models import Category, Collections


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    products_count = serializers.IntegerField(source='get_products_count')

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'children', 'products_count', 'image',)

    def get_children(self, obj):
        children_categories = obj.get_children().filter(products__isnull=False).distinct()
        serializer = CategorySerializer(children_categories, many=True)
        serializer.context.update(self.context)
        return serializer.data


class CollectionsSerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='get_products_count')

    class Meta:
        model = Collections
        fields = ('id', 'name', 'slug', 'image', 'products_count')


class CategoriesWithProductsCountSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(source='get_products_count')

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'children', 'products_count', 'product_count')

    @staticmethod
    def get_children(obj):
        children_categories = obj.get_children().filter(products__isnull=False).distinct()
        return CategoriesWithProductsCountSerializer(children_categories, many=True).data
