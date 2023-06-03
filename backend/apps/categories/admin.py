from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from apps.categories.models import Category, CategoryAttributeGroup, Collections
from apps.categories.forms import CategoryAttributeGroupForm


class CategoryAttributeGroupInline(admin.TabularInline):
    model = CategoryAttributeGroup
    form = CategoryAttributeGroupForm
    extra = 0


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    mptt_level_indent = 20
    list_display = ('name', 'parent')
    list_filter = ('attribute_groups',)

    inlines = [CategoryAttributeGroupInline]


# class CollectionProductInline(admin.TabularInline):
#     model = Collections.products.through
#     extra = 0


@admin.register(Collections)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    # inlines = [CollectionProductInline]
