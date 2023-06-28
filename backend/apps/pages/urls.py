from apps.pages.views import HomeSliderViewSet, PagesViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'home-slider', HomeSliderViewSet, basename='home-slider')
router.register(r'pages', PagesViewSet, basename='pages')

urlpatterns = []
urlpatterns += router.urls
