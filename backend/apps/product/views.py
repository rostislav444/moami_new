from rest_framework import viewsets, mixins, generics

from apps.product.models import Variant, Product

from apps.product.serializers import VariantSerializer, ProductSerializer
from unidecode import unidecode

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
        slug = self.kwargs['slug']

        product = slug.split('-c-')[0][2:]
        code = slug.split('-c-')[1]

        # return Variant.objects.get(product__slug__iexact=product, code__iexact=code)
        try:
            return Variant.objects.get(product__slug__iexact=unidecode(product), code__iexact=code)
        except Variant.DoesNotExist:
            return Variant.objects.none



