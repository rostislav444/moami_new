from django.urls import path
from rest_framework import routers

from apps.product import views

router = routers.DefaultRouter()
router.register(r'products', views.ProductList, basename='products')
router.register(r'variants', views.VariantViewSet, basename='variants')

urlpatterns = [
    path('variants/slug-list/', views.variant_slug_list_json, name='variant_slug_list_json'),
]
urlpatterns += router.urls
