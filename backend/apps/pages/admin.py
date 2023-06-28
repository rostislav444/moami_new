from django.contrib import admin
from apps.pages.models import HomeSlider, Pages


@admin.register(HomeSlider)
class HomeSliderAdmin(admin.ModelAdmin):
    # Default slide type is image. When it selected display only image field, if slide type is mini_post display
    # title, description, image and image_2 fields
    fieldsets = (
        (None, {
            'fields': ('slide_type', 'title', 'description', 'image', 'image_2', 'is_active')
        }),
    )
    list_display = ('title', 'slide_type', 'is_active')
    list_filter = ('slide_type', 'is_active')
    search_fields = ('title', 'description')
    ordering = ('title',)

    def get_fieldsets(self, request, obj=None):
        if obj and obj.slide_type == 'mini_post':
            return (
                (None, {
                    'fields': (
                    'slide_type', 'link_type', 'link', 'title', 'description', 'image', 'image_2', 'is_active')
                }),
            )
        return (
            (None, {
                'fields': ('slide_type', 'link_type', 'link', 'title', 'description', 'image', 'is_active')
            }),
        )


@admin.register(Pages)
class PagesAdmin(admin.ModelAdmin):
    pass
