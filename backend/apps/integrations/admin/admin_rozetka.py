from django.contrib import admin
from singlemodeladmin import SingleModelAdmin

from apps.integrations.models import RozetkaCategories, RozetkaAdaptation


@admin.register(RozetkaCategories)
class RozetkaCategoriesAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    list_filter = ('parent',)
    search_fields = ('name',)


@admin.register(RozetkaAdaptation)
class RozetkaAdaptationAdmin(SingleModelAdmin):
    pass


