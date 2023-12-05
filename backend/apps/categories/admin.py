from admin_auto_filters.filters import AutocompleteFilter
from django.contrib import admin
from django.utils.safestring import mark_safe
from mptt.admin import MPTTModelAdmin

from apps.categories.forms import CategoryAttributeGroupForm
from apps.categories.models import Category, CategoryAttributeGroup, Collections


class CategoryAttributeGroupInline(admin.TabularInline):
    model = CategoryAttributeGroup
    form = CategoryAttributeGroupForm
    extra = 0


class CategoryFilter(AutocompleteFilter):
    title = 'Категория'
    field_name = 'google_taxonomy'


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    mptt_level_indent = 20
    list_display = ('name', 'google_taxonomy', 'facebook_category', 'modna_kast_category', 'ordering', 'size_group')
    list_filter = [CategoryFilter]
    sortable = 'ordering'

    search_fields = ['google_taxonomy__name_ru, facebook_category__name', 'modna_kast_category__name_alias']
    autocomplete_fields = ['google_taxonomy', 'facebook_category', 'modna_kast_category']

    def get_image(self, obj):
        style = 'border: 1px solid #ccc; object-fit: cover;'
        if obj.image:
            return mark_safe('<img src="{}" style="{}" width="200" height="200" />'.format(obj.image.url, style))
        return '-'

    fieldsets = (
        (None, {
            'fields': ('name', 'parent', 'size_group', 'preferred_size_grid', 'google_taxonomy', 'facebook_category',
                       'modna_kast_category', 'ordering', 'update_mk_stock')
        }),
        ('Изображение', {
            'fields': ('get_image', 'image',)
        }),
    )

    readonly_fields = ('get_image',)
    get_image.short_description = 'Изображение'
    inlines = [CategoryAttributeGroupInline]


@admin.register(Collections)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    # inlines = [CollectionProductInline]
