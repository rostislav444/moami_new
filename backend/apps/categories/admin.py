from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from django.utils.safestring import mark_safe
from mptt.admin import MPTTModelAdmin

from apps.categories.forms import CategoryAttributeGroupForm
from apps.categories.models import Category, CategoryAttributeGroup, Collections


class CategoryAttributeGroupInline(admin.TabularInline):
    model = CategoryAttributeGroup
    form = CategoryAttributeGroupForm
    extra = 0


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    mptt_level_indent = 20
    list_display = ('name', 'size_group')
    list_filter = ('attribute_groups',)
    sortable = 'ordering'

    def get_image(self, obj):
        style = 'border: 1px solid #ccc; object-fit: cover;'
        if obj.image:
            return mark_safe(
                '<img src="{}" style="{}" width="200" height="200" />'.format(obj.image.url, style)
            )

        return '-'

    fieldsets = (
        (None, {
            'fields': ('name', 'parent', 'size_group', 'preferred_size_grid', 'ordering')
        }),
        ('Изображение', {
            'fields': ('get_image', 'image',)
        }),
    )

    readonly_fields = ('get_image',)

    get_image.short_description = 'Изображение'

    inlines = [CategoryAttributeGroupInline]


# class CollectionProductInline(admin.TabularInline):
#     model = Collections.products.through
#     extra = 0


@admin.register(Collections)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    # inlines = [CollectionProductInline]
