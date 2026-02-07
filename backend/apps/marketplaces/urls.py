from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MarketplaceViewSet,
    MarketplaceCategoryViewSet,
    CategoryMappingViewSet,
    MarketplaceAttributeSetViewSet,
    MarketplaceAttributeViewSet,
    ProductMarketplaceConfigViewSet,
    ProductMarketplaceAttributeViewSet,
    SyncViewSet,
    FeedTemplateViewSet,
    AIAssistantViewSet,
)
from .views.product_views import ProductExportStatusViewSet

router = DefaultRouter()
router.register(r'marketplaces', MarketplaceViewSet, basename='marketplace')
router.register(r'marketplace-categories', MarketplaceCategoryViewSet, basename='marketplace-category')
router.register(r'category-mappings', CategoryMappingViewSet, basename='category-mapping')
router.register(r'attribute-sets', MarketplaceAttributeSetViewSet, basename='attribute-set')
router.register(r'marketplace-attributes', MarketplaceAttributeViewSet, basename='marketplace-attribute')
router.register(r'product-configs', ProductMarketplaceConfigViewSet, basename='product-config')
router.register(r'product-attributes', ProductMarketplaceAttributeViewSet, basename='product-attribute')
router.register(r'export-status', ProductExportStatusViewSet, basename='export-status')
router.register(r'sync', SyncViewSet, basename='sync')
router.register(r'feed-templates', FeedTemplateViewSet, basename='feed-template')
router.register(r'ai', AIAssistantViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
