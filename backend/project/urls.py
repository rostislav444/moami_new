from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

api = [
    path('order/', include('apps.order.urls')),
    path('category/', include('apps.categories.urls')),
    path('catalogue/', include('apps.catalogue.urls')),
    path('pages/', include('apps.pages.urls')),
    path('product/', include('apps.product.urls')),
    path('newpost/', include('apps.newpost.urls')),
    path('sizes/', include('apps.sizes.urls')),
    path('', include('apps.core.urls')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    # Apps
    path('api/', include(api)),

]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
