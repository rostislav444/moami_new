from django.contrib import admin
from mptt.admin import MPTTModelAdmin

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceCategory,
    CategoryMapping,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
    AttributeMapping,
    MarketplaceEntity,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
    ProductMarketplaceConfig,
    ProductMarketplaceAttribute,
)


# =============================================================================
# Marketplace
# =============================================================================

@admin.register(Marketplace)
class MarketplaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'integration_type', 'is_active', 'last_sync', 'categories_count']
    list_filter = ['integration_type', 'is_active']
    search_fields = ['name', 'slug']
    readonly_fields = ['last_sync', 'last_feed_generated', 'created_at', 'updated_at']

    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'integration_type', 'is_active')
        }),
        ('API Configuration', {
            'fields': ('api_config',),
            'classes': ('collapse',)
        }),
        ('Feed Configuration', {
            'fields': ('feed_template', 'feed_filename', 'feed_url'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('last_sync', 'last_feed_generated', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def categories_count(self, obj):
        return obj.categories.count()
    categories_count.short_description = 'Категорий'


# =============================================================================
# Categories
# =============================================================================

@admin.register(MarketplaceCategory)
class MarketplaceCategoryAdmin(MPTTModelAdmin):
    list_display = ['name', 'marketplace', 'external_code', 'has_children', 'is_active']
    list_filter = ['marketplace', 'is_active', 'has_children']
    search_fields = ['name', 'external_code', 'external_id']
    raw_id_fields = ['parent']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('marketplace')


@admin.register(CategoryMapping)
class CategoryMappingAdmin(admin.ModelAdmin):
    list_display = ['category', 'marketplace_category', 'is_active']
    list_filter = ['marketplace_category__marketplace', 'is_active']
    search_fields = ['category__name', 'marketplace_category__name']
    autocomplete_fields = ['category', 'marketplace_category']


# =============================================================================
# Attributes
# =============================================================================

class MarketplaceAttributeInline(admin.TabularInline):
    model = MarketplaceAttribute
    extra = 0
    readonly_fields = ['external_code', 'name', 'attr_type', 'is_required', 'is_system']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(MarketplaceAttributeSet)
class MarketplaceAttributeSetAdmin(admin.ModelAdmin):
    list_display = ['name', 'marketplace', 'external_code', 'attributes_count', 'required_attributes_count']
    list_filter = ['marketplace']
    search_fields = ['name', 'external_code']
    inlines = [MarketplaceAttributeInline]

    def attributes_count(self, obj):
        return obj.attributes.count()
    attributes_count.short_description = 'Атрибутов'

    def required_attributes_count(self, obj):
        return obj.attributes.filter(is_required=True).count()
    required_attributes_count.short_description = 'Обязат.'


class MarketplaceAttributeOptionInline(admin.TabularInline):
    model = MarketplaceAttributeOption
    extra = 0
    readonly_fields = ['external_code', 'name', 'name_uk']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(MarketplaceAttribute)
class MarketplaceAttributeAdmin(admin.ModelAdmin):
    list_display = ['name', 'attribute_set', 'external_code', 'attr_type', 'is_required', 'is_system', 'options_count']
    list_filter = ['attribute_set__marketplace', 'attr_type', 'is_required', 'is_system']
    search_fields = ['name', 'external_code']
    inlines = [MarketplaceAttributeOptionInline]

    def options_count(self, obj):
        if obj.has_options:
            return obj.options.count()
        return '-'
    options_count.short_description = 'Опций'


@admin.register(MarketplaceAttributeOption)
class MarketplaceAttributeOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'attribute', 'external_code']
    list_filter = ['attribute__attribute_set__marketplace']
    search_fields = ['name', 'external_code', 'name_uk']


@admin.register(AttributeMapping)
class AttributeMappingAdmin(admin.ModelAdmin):
    list_display = ['our_attribute', 'marketplace_attribute', 'marketplace_option']
    list_filter = ['marketplace_attribute__attribute_set__marketplace']
    search_fields = ['our_attribute__name', 'marketplace_attribute__name']
    raw_id_fields = ['our_attribute']
    autocomplete_fields = ['marketplace_attribute', 'marketplace_option']


# =============================================================================
# Entities
# =============================================================================

@admin.register(MarketplaceEntity)
class MarketplaceEntityAdmin(admin.ModelAdmin):
    list_display = ['name', 'marketplace', 'entity_type', 'external_code']
    list_filter = ['marketplace', 'entity_type']
    search_fields = ['name', 'external_code', 'external_id']


@admin.register(BrandMapping)
class BrandMappingAdmin(admin.ModelAdmin):
    list_display = ['brand', 'marketplace_entity']
    list_filter = ['marketplace_entity__marketplace']
    search_fields = ['brand__name', 'marketplace_entity__name']
    raw_id_fields = ['brand', 'marketplace_entity']


@admin.register(ColorMapping)
class ColorMappingAdmin(admin.ModelAdmin):
    list_display = ['color', 'marketplace_entity']
    list_filter = ['marketplace_entity__marketplace']
    search_fields = ['color__name', 'marketplace_entity__name']
    raw_id_fields = ['color', 'marketplace_entity']


@admin.register(CountryMapping)
class CountryMappingAdmin(admin.ModelAdmin):
    list_display = ['country', 'marketplace_entity']
    list_filter = ['marketplace_entity__marketplace']
    search_fields = ['country__name', 'marketplace_entity__name']
    raw_id_fields = ['country', 'marketplace_entity']


@admin.register(SizeMapping)
class SizeMappingAdmin(admin.ModelAdmin):
    list_display = ['size', 'marketplace_entity']
    list_filter = ['marketplace_entity__marketplace']
    raw_id_fields = ['size', 'marketplace_entity']


# =============================================================================
# Product Export
# =============================================================================

@admin.register(ProductMarketplaceConfig)
class ProductMarketplaceConfigAdmin(admin.ModelAdmin):
    list_display = ['product', 'marketplace', 'is_active', 'last_exported']
    list_filter = ['marketplace', 'is_active']
    search_fields = ['product__name', 'custom_name']
    autocomplete_fields = ['product', 'marketplace', 'category_override']


@admin.register(ProductMarketplaceAttribute)
class ProductMarketplaceAttributeAdmin(admin.ModelAdmin):
    list_display = ['product', 'marketplace_attribute', 'get_value_display']
    list_filter = ['marketplace_attribute__attribute_set__marketplace', 'marketplace_attribute']
    search_fields = ['product__name', 'marketplace_attribute__name']
    autocomplete_fields = ['product', 'marketplace_attribute', 'value_option']
    filter_horizontal = ['value_options']

    def get_value_display(self, obj):
        value = obj.get_value()
        if value is None:
            return '-'
        if isinstance(value, list):
            return ', '.join([str(v) for v in value[:3]]) + ('...' if len(value) > 3 else '')
        return str(value)[:50]
    get_value_display.short_description = 'Значение'
