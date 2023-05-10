from rest_framework import serializers

from apps.categories.models import Category, Collections


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'children')

    def get_children(self, obj):
        return CategorySerializer(obj.get_children(), many=True).data


class CollectionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collections
        fields = ('id', 'name', 'slug', 'image')