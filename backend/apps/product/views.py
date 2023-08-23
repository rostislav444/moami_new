import json

from django.http import HttpResponse
from rest_framework import viewsets
from unidecode import unidecode

from apps.product.models import Product, Variant
from apps.product.serializers import ProductSerializer, VariantSerializer


class ProductList(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class VariantViewSet(viewsets.ModelViewSet):
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Variant.objects.all()

    def get_object(self):
        split_slug = self.kwargs['slug'].split('-code-')
        product_slug = split_slug[0]
        code = split_slug[1]

        try:
            return Variant.objects.get(product__slug__iexact=product_slug, code__iexact=code)
        except Variant.DoesNotExist:
            return Variant.objects.none()


def variant_slug_list_json(request):
    variants = Variant.objects.all()
    variant_slug_list = []
    for variant in variants:
        variant_slug_list.append(unidecode(variant.slug))

    response = json.dumps(variant_slug_list)
    return HttpResponse(response, content_type='application/json')
