from apps.integrations.views import rozetka
from django.urls import path


urlpatterns = [
    path('rozetka.xml', rozetka, name='rozetka'),
]