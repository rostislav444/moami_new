from rest_framework.routers import DefaultRouter

from apps.categories.views import CategoriesView, CollectionsView

router = DefaultRouter()
router.register(r'categories', CategoriesView, basename='category')
router.register(r'collections', CollectionsView, basename='collection')


urlpatterns = []
urlpatterns += router.urls


