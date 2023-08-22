from django.contrib import admin
from singlemodeladmin import SingleModelAdmin
from apps.newpost.models import NewPostApiKey, NewPostAreas, NewPostRegion, NewPostCities, NewPostDepartments


@admin.register(NewPostApiKey)
class NewPostApiKeyAdmin(SingleModelAdmin):
    pass


@admin.register(NewPostAreas)
class NewPostAreasAdmin(admin.ModelAdmin):
    list_display = ['description', 'description_ru', 'ref', 'areas_center']
    search_fields = ['description', 'description_ru', 'ref', 'areas_center']


@admin.register(NewPostRegion)
class NewPostRegionAdmin(admin.ModelAdmin):
    list_display = ['pk', 'description', 'description_ru']


class NewPostDepartmentsInline(admin.TabularInline):
    model = NewPostDepartments
    extra = 0


@admin.register(NewPostCities)
class NewPostCitiesAdmin(admin.ModelAdmin):
    list_display = ['ref', 'description', 'region']
    search_fields = ['description', 'description_ru']
    inlines = [NewPostDepartmentsInline]


@admin.register(NewPostDepartments)
class NewPostDepartmentsAdmin(admin.ModelAdmin):
    list_display = ['site_key', 'description', 'city']
    search_fields = ['description', 'description_ru']
    list_filter = ['city__region__area__description']
