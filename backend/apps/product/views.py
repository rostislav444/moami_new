import datetime
import json

from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.vary import vary_on_headers
from rest_framework import mixins, viewsets
from rest_framework.exceptions import NotFound
from unidecode import unidecode

from apps.core.utils.cache import cache_per_view_and_locale
from apps.product.models import Product, ProductComment, Variant, VariantViews, VarintViewSource
from apps.product.serializers import ProductSerializer, VariantSerializer, ProductCommentSerializer


class ProductList(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


@method_decorator(vary_on_headers('Accept-Language'), name='dispatch')
@method_decorator(cache_per_view_and_locale(60 * 60), name='dispatch')
class VariantViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.GET.get('ids'):
            ids = self.request.GET.get('ids').split(',')
            return Variant.objects.filter(id__in=ids)
        else:
            return Variant.objects.all()

    def get_object(self):
        split_slug = self.kwargs['slug'].split('-code-')
        if len(split_slug) != 2:
            raise NotFound(detail="Variant not found.")

        product_slug = split_slug[0]
        code = split_slug[1]

        try:
            return Variant.objects.select_related(
                'product', 'color',
            ).prefetch_related(
                'images', 'sizes', 'product__compositions'
            ).get(code__iexact=code)
        except Variant.DoesNotExist:
            raise NotFound(detail="Variant not found.")


def variant_slug_list_json(request):
    variants = Variant.objects.all()
    variant_slug_list = []
    for variant in variants:
        if len(variant.slug) > 1:
            variant_slug_list.append(unidecode(variant.slug))

    response = json.dumps(variant_slug_list)
    return HttpResponse(response, content_type='application/json')


def variant_views(request):
    today = datetime.date.today()
    variant_id = request.GET.get('variant_id')
    utm_source = request.GET.get('utm_source')

    variant = Variant.objects.get(id=variant_id)
    try:
        today_views = VariantViews.objects.get(variant=variant, day=today)
    except VariantViews.DoesNotExist:
        today_views = VariantViews(variant=variant, day=today, views=0)

    today_views.views += 1
    today_views.save()

    if utm_source:
        try:
            source = VarintViewSource.objects.get(variant_view=today_views, utm_source=utm_source)
        except VarintViewSource.DoesNotExist:
            source = VarintViewSource(variant_view=today_views, utm_source=utm_source, views=0)
        source.views += 1
        source.save()

    return HttpResponse(today_views.views, content_type='application/json')


class ProductCommentsView(mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.ListModelMixin,
                          viewsets.GenericViewSet):
    serializer_class = ProductCommentSerializer
    queryset = ProductComment.objects.all()

    def get_queryset(self):
        if self.request.GET.get('product_id'):
            product_id = self.request.GET.get('product_id')
            return ProductComment.objects.filter(product__id=product_id)
        return ProductComment.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_object(self):
        if self.request.GET.get('product_id'):
            product_id = self.request.GET.get('product_id')
            return ProductComment.objects.filter(product__id=product_id)
        return ProductComment.objects.none()
