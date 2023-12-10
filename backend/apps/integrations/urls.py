from django.urls import path

from apps.integrations import views

urlpatterns = [
    path('rozetka.xml', views.rozetka, name='rozetka'),
    path('modna_kasta.xml', views.modna_kasta, name='modna_kasta'),
    path('google_multilang.xml', views.google_multilang, name='google_multilang'),
    path('<str:lang_code>/google.xml', views.google, name='google'),
    path('<str:lang_code>/facebook.xml', views.facebook, name='facebook'),
]