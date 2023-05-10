from apps.order import views
from rest_framework import routers
from django.urls import path

router = routers.DefaultRouter()
router.register(r'', views.OrderViewSet)

urlpatterns = [
    path('check-sizes-availability/', views.CheckSizesAvailability.as_view())
] + router.urls