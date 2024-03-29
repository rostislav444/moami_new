from django.urls import path
from rest_framework import routers

from apps.product import views

router = routers.DefaultRouter()
router.register(r'products', views.ProductList, basename='products')
router.register(r'variants', views.VariantViewSet, basename='variants')
router.register(r'comment', views.ProductCommentsView, basename='comment')

urlpatterns = [
    path('variants/slug-list/', views.variant_slug_list_json, name='variant_slug_list_json'),
    path('variants/views/', views.variant_views, name='variant_views'),
]
urlpatterns += router.urls
