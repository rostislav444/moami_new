from django.shortcuts import render

from apps.product.models import Product
from apps.integrations.models import RozetkaCategories
from apps.integrations.serializers import FeedProductSerializer, RozetkaCategoriesSerializer


def rozetka(request):
    products = Product.objects\
        .select_related('brand')\
        .prefetch_related('variants')\
        .prefetch_related('variants__images')\
        .prefetch_related('variants__sizes')\
        .prefetch_related('variants__sizes__size')\
        .prefetch_related('variants__color') \
        .prefetch_related('variants__color__translations') \
        .prefetch_related('attributes') \
        .prefetch_related('attributes__attribute_group') \
        .prefetch_related('attributes__attributes') \
        .filter(rozetka_category__isnull=False).exclude(variants__isnull=True).distinct()
    products_serializer = FeedProductSerializer(products, many=True)

    categories = RozetkaCategories.objects.all()
    categories_serializer = RozetkaCategoriesSerializer(categories, many=True)

    response = {
        'products': products_serializer.data,
        'categories': categories_serializer.data,
    }
    return render(request, 'feed/rozetka.xml', response, content_type='application/xml')