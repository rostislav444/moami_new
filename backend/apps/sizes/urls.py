from apps.sizes.views import SizeGridViewSet
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'size-grids', SizeGridViewSet, basename='size-grid')

urlpatterns = router.urls


