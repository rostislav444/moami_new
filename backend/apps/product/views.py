from rest_framework import viewsets, mixins, generics

from apps.product.models import Variant, Product

from apps.product.serializers import VariantSerializer, ProductSerializer


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
        print(product)
        code = slug.split('-c-')[1]
        return Variant.objects.get(code__iexact=code)



