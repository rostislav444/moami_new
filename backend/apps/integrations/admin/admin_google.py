from django.contrib import admin
from singlemodeladmin import SingleModelAdmin

from apps.integrations.models import GoogleTaxonomy, GoogleTaxonomyUplaoder


@admin.register(GoogleTaxonomy)
class GoogleTaxonomyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_ru', 'name',)
    list_filter = ('name_ru',)
    search_fields = ('name_ru', 'name',)


@admin.register(GoogleTaxonomyUplaoder)
class GoogleTaxonomyUploaderAdmin(SingleModelAdmin):
    pass


__all__ = [
    'GoogleTaxonomyAdmin',
    'GoogleTaxonomyUploaderAdmin'
]