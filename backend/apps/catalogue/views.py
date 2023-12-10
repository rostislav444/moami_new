from django.db.models import Sum
from rest_framework import generics, viewsets, mixins
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination

from apps.catalogue.serializers import CatalogueVariantSerializer
from apps.categories.models import Category
from apps.product.models import Variant


class CatalogueVariantsPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 96


class CatalogueVariantsViewSet(generics.GenericAPIView, mixins.ListModelMixin, viewsets.ViewSet):
    serializer_class = CatalogueVariantSerializer
    pagination_class = CatalogueVariantsPagination

    @staticmethod
    def filter_by_collection(variants, collection_slug=None):
        if collection_slug:
            return variants.filter(product__collections__slug=collection_slug).distinct()
        return variants

    @staticmethod
    def get_products_by_categories(variants, category_slug):
        category = None
        for slug in category_slug.split(','):
            try:
                category = Category.objects.get(slug=slug) if not category else category.children.get(slug=slug)
            except Category.DoesNotExist:
                raise NotFound(detail="Category not found", code=404)

        # Get all descendants of the final category, including the category itself
        categories = category.get_descendants(include_self=True)

        # Filter the variants by the categories
        return variants.filter(product__category__in=categories).distinct()

    def get_queryset(self):
        params = self.request.GET

        variants = Variant.objects.filter(images__isnull=False, sizes__isnull=False).annotate(
            total_sizes=Sum('sizes__stock')).exclude(total_sizes=0).distinct()

        if 'category' in params:
            return self.get_products_by_categories(variants, params['category'])
        elif 'collection' in params:
            return self.filter_by_collection(variants, params['collection'])
        return Variant.objects.none()
