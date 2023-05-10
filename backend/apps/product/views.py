from rest_framework import viewsets, mixins, generics

from apps.product.models import Variant

from apps.product.serializers import VariantSerializer


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
        return Variant.objects.get(code__iexact=code)



