from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from singlemodeladmin import SingleModelAdmin

from apps.integrations.models import FacebookCategories, FacebookCategoriesLoader


@admin.register(FacebookCategories)
class FacebookCategoriesAdmin(MPTTModelAdmin):
    list_display = ['name', 'facebook_id', 'parent']
    list_filter = ['parent']
    search_fields = ['name', 'facebook_id', 'full_name']


@admin.register(FacebookCategoriesLoader)
class FacebookCategoriesLoaderAdmin(SingleModelAdmin):
    pass


__all__ = [
    'FacebookCategoriesAdmin',
    'FacebookCategoriesLoaderAdmin'
]