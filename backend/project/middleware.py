from django.middleware.locale import LocaleMiddleware
from django.urls import reverse

class AdminStrictLocaleMiddleware(LocaleMiddleware):

    def process_request(self, request):
        # Check if it's the admin URL.
        if request.path.startswith(reverse('admin:index')):
            from django.utils import translation
            translation.activate('ru')
            request.LANGUAGE_CODE = 'ru'
        else:
            super().process_request(request)
