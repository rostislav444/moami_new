from rest_framework import routers

from apps.product.views import VariantViewSet, ProductList

router = routers.DefaultRouter()
router.register(r'products', ProductList, basename='products')
router.register(r'variants', VariantViewSet, basename='variants')

urlpatterns = []
urlpatterns += router.urls