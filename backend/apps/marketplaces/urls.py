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
    ResearchViewSet,
    PipelineViewSet,
    PipelineStepViewSet,
    PipelineRunViewSet,
    BackgroundTaskViewSet,
    MarketplaceAttributeLevelViewSet,
    ProductAdminViewSet,
    MarketplaceEntityViewSet,
    BrandMappingViewSet,
    ColorMappingViewSet,
    CountryMappingViewSet,
    SizeMappingViewSet,
    ExportConfigViewSet,
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
router.register(r'research', ResearchViewSet, basename='research')
router.register(r'pipelines', PipelineViewSet, basename='pipeline')
router.register(r'pipeline-steps', PipelineStepViewSet, basename='pipeline-step')
router.register(r'pipeline-runs', PipelineRunViewSet, basename='pipeline-run')
router.register(r'tasks', BackgroundTaskViewSet, basename='task')
router.register(r'attribute-levels', MarketplaceAttributeLevelViewSet, basename='attribute-level')
router.register(r'admin-products', ProductAdminViewSet, basename='admin-product')
router.register(r'marketplace-entities', MarketplaceEntityViewSet, basename='marketplace-entity')
router.register(r'brand-mappings', BrandMappingViewSet, basename='brand-mapping')
router.register(r'color-mappings', ColorMappingViewSet, basename='color-mapping')
router.register(r'country-mappings', CountryMappingViewSet, basename='country-mapping')
router.register(r'size-mappings', SizeMappingViewSet, basename='size-mapping')
router.register(r'export-config', ExportConfigViewSet, basename='export-config')

from .views.lookup_views import (
    lookup_brands,
    lookup_countries,
    lookup_colors,
    lookup_categories,
    lookup_sizes,
    lookup_compositions,
    lookup_attribute_groups,
    ai_usage_stats,
)

urlpatterns = [
    path('', include(router.urls)),
    # Lookup endpoints
    path('admin-lookups/brands/', lookup_brands, name='lookup-brands'),
    path('admin-lookups/countries/', lookup_countries, name='lookup-countries'),
    path('admin-lookups/colors/', lookup_colors, name='lookup-colors'),
    path('admin-lookups/categories/', lookup_categories, name='lookup-categories'),
    path('admin-lookups/sizes/', lookup_sizes, name='lookup-sizes'),
    path('admin-lookups/compositions/', lookup_compositions, name='lookup-compositions'),
    path('admin-lookups/attribute-groups/', lookup_attribute_groups, name='lookup-attribute-groups'),
    path('admin-lookups/ai-usage/', ai_usage_stats, name='ai-usage-stats'),
]
