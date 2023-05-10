from django.contrib import admin
from apps.core.models import Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_en')
    search_fields = ('name', 'name_en')
    ordering = ('name',)
