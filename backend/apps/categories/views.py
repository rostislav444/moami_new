from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import generics, mixins, viewsets

from apps.categories.models import Category, Collections
from apps.categories.serializers import CategorySerializer, CollectionsSerializer


def cache_per_view_and_locale(timeout):
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            # Append the language and the path to the cache key
            key_prefix = "{}__{}".format(request.LANGUAGE_CODE, request.path)
            print(key_prefix)
            return cache_page(timeout, key_prefix=key_prefix)(func)(request, *args, **kwargs)

        return wrapper

    return decorator


# @method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
# @method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class CategoriesView(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(
            parent=None, children__products__isnull=False
        ).distinct()


# @method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
# @method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class CollectionsView(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    queryset = Collections.objects.all()
    serializer_class = CollectionsSerializer

    def get_queryset(self):
        return Collections.objects.all().prefetch_related('products__variants')



