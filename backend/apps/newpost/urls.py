from rest_framework import routers
from apps.newpost import views

app_name = "newpost"

router = routers.DefaultRouter()
router.register(r'areas', views.NewPostAreasViewSet, basename="areas")
router.register(r'cities', views.NewPostCitiesViewSet, basename="cities")
router.register(r'departments', views.NewPostDepartmentsViewSet, basename="departments")

urlpatterns = router.urls
