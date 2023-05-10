from rest_framework.routers import DefaultRouter

from apps.catalogue import views

router = DefaultRouter()
router.register(r'', views.CatalogueVariantsViewSet, basename='catalogue')

urlpatterns = []
urlpatterns += router.urls


