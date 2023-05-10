from rest_framework import routers

from apps.product.views import VariantViewSet

router = routers.DefaultRouter()
router.register(r'variants', VariantViewSet, basename='variants')

urlpatterns = []
urlpatterns += router.urls