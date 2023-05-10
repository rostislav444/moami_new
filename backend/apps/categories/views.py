from rest_framework import generics, mixins, viewsets

from apps.categories.models import Category, Collections
from apps.categories.serializers import CategorySerializer, CollectionsSerializer


class CategoriesView(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(parent=None)


class CollectionsView(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = Collections.objects.all()
    serializer_class = CollectionsSerializer

    def get_queryset(self):
        return Collections.objects.all()