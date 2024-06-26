import os

from django.http import FileResponse
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string

from apps.integrations.serializers import GoogleProductSerializer, GoogleProductByLanguageSerializer, \
    FacebookProductSerializer
from apps.product.models import Product
from project import settings


def rozetka(request):
    path = os.path.join(settings.MEDIA_ROOT, 'feed', 'rozetka.xml')
    if os.path.exists(path):
        return FileResponse(open(path, "rb"))
    return HttpResponse("The XML file does not exist.", status=404)


def modna_kasta(request):
    path = os.path.join(settings.MEDIA_ROOT, 'feed', 'modna_kasta.xml')
    if os.path.exists(path):
        return FileResponse(open(path, "rb"))
    return HttpResponse("The XML file does not exist.", status=404)


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
