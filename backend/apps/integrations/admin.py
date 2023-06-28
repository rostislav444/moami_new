from django.contrib import admin
from apps.integrations.models import RozetkaCategories, GoogleTaxonomy, GoogleTaxonomyUplaoder
from singlemodeladmin import SingleModelAdmin


@admin.register(RozetkaCategories)
class RozetkaCategoriesAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    list_filter = ('parent',)
    search_fields = ('name',)


@admin.register(GoogleTaxonomy)
class GoogleTaxonomyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'name_ru')
    list_filter = ('name',)
    search_fields = ('name',)


@admin.register(GoogleTaxonomyUplaoder)
class GoogleTaxonomyUplaoderAdmin(admin.ModelAdmin):
    list_display = ('id', 'table', 'table_ru')
    list_filter = ('table',)
    search_fields = ('table',)
