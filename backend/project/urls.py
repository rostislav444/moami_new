from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # Admin
    path('admin/', admin.site.urls),
    # Apps
    path('order/', include('apps.order.urls')),
    path('category/', include('apps.categories.urls')),
    path('catalogue/', include('apps.catalogue.urls')),
    path('pages/', include('apps.pages.urls')),
    path('product/', include('apps.product.urls')),
    path('newpost/', include('apps.newpost.urls')),
    path('sizes/', include('apps.sizes.urls')),
    path('', include('apps.core.urls')),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
