import json

import mixins as mixins
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from rest_framework import viewsets
from unidecode import unidecode
from rest_framework.response import Response
from apps.product.models import Product, Variant
from apps.product.serializers import ProductSerializer, VariantSerializer

from rest_framework import generics, mixins, views, viewsets


class ProductList(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class VariantViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.GET.get('ids'):
            ids = self.request.GET.get('ids').split(',')
            return Variant.objects.filter(id__in=ids)
        return Variant.objects.none()

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


