from rest_framework import serializers

from apps.categories.models import Category, Collections


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'children')

    def get_children(self, obj):
        children_categories = obj.get_children().filter(products__isnull=False).distinct()
        return CategorySerializer(children_categories, many=True).data


class CollectionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collections
        fields = ('id', 'name', 'slug', 'image')