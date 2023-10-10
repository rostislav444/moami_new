from apps.product.admin.admin_product import ProductAdmin, BrandAdmin, CountryAdmin, ColorAdmin
from apps.product.admin.admin_variant import VariantAdmin, VariantImageAdmin
from apps.product.admin.admin_variant_size import VariantSizeInline
from apps.product.admin.admin_variant_views import VariantViewsAdmin

__all__ = [
    'ProductAdmin',
    'BrandAdmin',
    'CountryAdmin',
    'ColorAdmin',
    'VariantAdmin',
    'VariantImageAdmin',
    'VariantSizeInline',
    'VariantViewsAdmin'
]
