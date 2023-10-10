from django.contrib import admin
from django.utils.safestring import mark_safe
from apps.product.models import VariantViews


@admin.register(VariantViews)
class VariantViewsAdmin(admin.ModelAdmin):
    def get_code(self, obj):
        return obj.variant.code

    get_code.short_description = 'Код'

    def get_image(self, obj):
        image = obj.variant.images.first()
        if image:
            return mark_safe(f'<img src="{image.image.url}" style="object-fit: cover;" width="100" height="150" />')
        return '-'

    get_image.short_description = 'Изображение'

    list_display = ('get_image', 'get_code', 'views', 'day')
    list_filter = ('day',)
    search_fields = ('variant', 'day')
    ordering = ('variant', 'day')
    readonly_fields = ('get_image', 'get_code', 'variant', 'views', 'day')
