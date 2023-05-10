from apps.pages.views import HomeSliderViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'home-slider', HomeSliderViewSet, basename='home-slider')

urlpatterns = []
urlpatterns += router.urls
