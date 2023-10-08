from apps.integrations import views
from django.urls import path
from django.conf.urls.i18n import i18n_patterns



urlpatterns = [
    path('rozetka.xml', views.rozetka, name='rozetka'),
    path('google_multilang.xml', views.google_multilang, name='google_multilang'),
    path('<str:lang_code>/google.xml', views.google, name='google'),
    path('<str:lang_code>/facebook.xml', views.facebook, name='facebook'),
]