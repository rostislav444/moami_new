from rest_framework import generics, viewsets, mixins
from apps.catalogue.serializers import CatalogueVariantSerializer
from apps.product.models import Variant
from apps.categories.models import Category

from rest_framework.pagination import PageNumberPagination


class CatalogueVariantsPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 96


class CatalogueVariantsViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    serializer_class = CatalogueVariantSerializer
    pagination_class = CatalogueVariantsPagination

    def filter_by_collection(self, queryset):
        collection = self.request.GET.get('collection')
        if collection:
            return queryset.filter(product__collections__slug=collection)
        return queryset

    def get_products_by_categories(self):
        category_name = self.request.GET.get('category')

        if category_name:
            category = None
            for name in category_name.split(','):
                if not category:
                    category = Category.objects.get(slug=name)
                else:
                    category = category.children.get(slug=name)
            categories = category.get_descendants(include_self=True)
            return Variant.objects.filter(product__category__in=categories)
        return Variant.objects.all()

    def get_queryset(self):
        variants = self.get_products_by_categories()
        variants = self.filter_by_collection(variants)
        return variants.filter(sizes__isnull=False).filter(sizes__stock__gt=0).distinct()

