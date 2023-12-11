from django.db.models import Prefetch
from django.db.models import Q
from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import translation
from django.views.decorators.cache import cache_page

from apps.integrations.models import RozetkaCategories, ModnaKastaCategories
from apps.integrations.serializers import RozetkaProductSerializer, RozetkaCategoriesSerializer, \
    GoogleProductSerializer, GoogleProductByLanguageSerializer, FacebookProductSerializer
from apps.integrations.serializers.serializers_modna_kasta_xml import ModnaKastaXMLProductSerializer
from apps.product.models import Product, ProductAttribute
from project import settings


@cache_page(60 * 60 * 24)
def rozetka(request):
    translation.activate('ru')

    # Prefetch and filter product attributes queryset
    # .filter(attribute_group__mk_key_name__isnull=True)
    product_attributes = ProductAttribute.objects.filter(
        Q(value_multi_attributes__isnull=False) |
        Q(value_single_attribute__isnull=False) |
        Q(value_int__isnull=False) |
        Q(value_str__isnull=False)
    ).prefetch_related(
        'attribute_group',
        'value_single_attribute',
        'value_multi_attributes'
    ).distinct()

    products = Product.objects.select_related('brand', 'category', 'country').prefetch_related(
        Prefetch('attributes', queryset=product_attributes),
        'variants',
        'variants__images',
        'variants__sizes__size',
        'variants__color__translations',
        'attributes__attribute_group'
    ).filter(rozetka_category__isnull=False).exclude(variants__isnull=True)

    products = products.distinct()

    categories = RozetkaCategories.objects.all()
    categories_serializer = RozetkaCategoriesSerializer(categories, many=True)
    products_serializer = RozetkaProductSerializer(products, many=True)

    context = {
        'categories': categories_serializer.data,
        'products': products_serializer.data,
    }

    return render(request, 'feed/rozetka.xml', context, content_type='application/xml')


# @cache_page(60 * 60 * 24)
def modna_kasta(request):
    translation.activate('ru')

    # Prefetch and filter product attributes queryset
    # .filter(attribute_group__mk_key_name__isnull=True)
    product_attributes = ProductAttribute.objects.filter(
        Q(value_multi_attributes__isnull=False) |
        Q(value_single_attribute__isnull=False) |
        Q(value_int__isnull=False) |
        Q(value_str__isnull=False)
    ).distinct()

    products = Product.objects.select_related('brand', 'category', 'country').prefetch_related(
        'variants',
        'variants__images',
        'variants__sizes__size',
        'variants__color__translations',
        'compositions__composition',
        'attributes__attribute_group',
        'attributes__value_single_attribute',
        'attributes__value_multi_attributes',
        Prefetch('attributes', queryset=product_attributes),
    ).filter(
        rozetka_category__isnull=False,
        category__modna_kast_category__isnull=False
    ).exclude(variants__isnull=True)

    products = products.distinct()

    categories = RozetkaCategories.objects.all().distinct()
    categories_serializer = RozetkaCategoriesSerializer(categories, many=True)
    products_serializer = ModnaKastaXMLProductSerializer(products, many=True)

    context = {
        'categories': categories_serializer.data,
        'products': products_serializer.data,
    }

    return render(request, 'feed/modna_kasta.xml', context, content_type='application/xml')


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
    content = render_to_string('feed/facebook.xml', {
        'products': serializer.data,
        'language': lang_code
    })
    return HttpResponse(content, content_type='application/xml')
