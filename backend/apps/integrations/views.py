from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.template.loader import render_to_string

from apps.integrations.models import RozetkaCategories
from apps.integrations.serializers import RozetkaProductSerializer, RozetkaCategoriesSerializer, \
    GoogleProductSerializer, GoogleProductByLanguageSerializer, FacebookProductSerializer
from apps.product.models import Product
from project import settings


def rozetka(request):
    products = Product.objects \
        .select_related('brand') \
        .prefetch_related('variants') \
        .prefetch_related('variants__images') \
        .prefetch_related('variants__sizes') \
        .prefetch_related('variants__sizes__size') \
        .prefetch_related('variants__color') \
        .prefetch_related('variants__color__translations') \
        .prefetch_related('attributes') \
        .prefetch_related('attributes__attribute_group') \
        .prefetch_related('attributes__attributes') \
        .filter(rozetka_category__isnull=False).exclude(variants__isnull=True).distinct()
    products_serializer = RozetkaProductSerializer(products, many=True)

    categories = RozetkaCategories.objects.all()
    categories_serializer = RozetkaCategoriesSerializer(categories, many=True)

    response = {
        'products': products_serializer.data,
        'categories': categories_serializer.data,
    }
    return render(request, 'feed/rozetka.xml', response, content_type='application/xml')


def google(request, lang_code):
    language_codes = [language[0] for language in settings.LANGUAGES]
    if lang_code not in language_codes:
        raise Http404("This language is not supported.")

    products = Product.objects.filter(category__google_taxonomy__isnull=False)
    serializer = GoogleProductSerializer(products, many=True)
    serializer.context.update({
        'request': request,
        'language': lang_code
    })
    content = render_to_string('feed/google.xml', {'products': serializer.data})
    return HttpResponse(content, content_type='application/xml')


def google_multilang(request):
    products = Product.objects.filter(category__google_taxonomy__isnull=False)
    serializer = GoogleProductByLanguageSerializer(products, many=True)
    serializer.context.update({
        'request': request,
    })
    content = render_to_string('feed/google_multilang.xml', {'products': serializer.data})
    return HttpResponse(content, content_type='application/xml')


def facebook(request, lang_code):
    language_codes = [language[0] for language in settings.LANGUAGES]
    if lang_code not in language_codes:
        raise Http404("This language is not supported.")

    products = Product.objects.filter(
        category__google_taxonomy__isnull=False,
        category__facebook_category__isnull=False
    )
    serializer = FacebookProductSerializer(products, many=True)
    serializer.context.update({
        'request': request,
        'language': lang_code
    })
    content = render_to_string('feed/facebook.xml', {'products': serializer.data})
    return HttpResponse(content, content_type='application/xml')
