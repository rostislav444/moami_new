from django.contrib import admin
from singlemodeladmin import SingleModelAdmin

from apps.integrations.models import RozetkaCategories, GoogleTaxonomy, GoogleTaxonomyUplaoder, RozetkaAdaptation


@admin.register(RozetkaCategories)
class RozetkaCategoriesAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    list_filter = ('parent',)
    search_fields = ('name',)


@admin.register(RozetkaAdaptation)
class RozetkaAdaptationAdmin(SingleModelAdmin):
    pass


@admin.register(GoogleTaxonomy)
class GoogleTaxonomyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_ru', 'name',)
    list_filter = ('name_ru',)
    search_fields = ('name_ru', 'name',)


@admin.register(GoogleTaxonomyUplaoder)
class GoogleTaxonomyUploaderAdmin(SingleModelAdmin):
    pass
