from django.contrib import admin
from django.utils.safestring import mark_safe

from apps.product.models import VariantViews, VarintViewSource


class VarintViewSourceInline(admin.TabularInline):
    model = VarintViewSource
    extra = 0


@admin.register(VariantViews)
class VariantViewsAdmin(admin.ModelAdmin):
    def get_source(self, obj):
        data = []
        for source in obj.view_sources.all():
            data.append(source.utm_source + ' - ' + str(source.views))
        return ', '.join(data)

    get_source.short_description = 'Источники'

    def get_code(self, obj):
        return obj.variant.get_effective_code

    get_code.short_description = 'Код'

    def get_image(self, obj):
        image = obj.variant.images.first()
        if image:
            return mark_safe(f'<img src="{image.image.url}" style="object-fit: cover;" width="100" height="150" />')
        return '-'

    get_image.short_description = 'Изображение'

    list_display = ('get_image', 'get_code', 'views', 'get_source', 'day')
    list_filter = ('day', 'view_sources__utm_source')
    search_fields = ('variant', 'day')
    ordering = ('-day', '-views', 'view_sources__views')
    readonly_fields = ('get_image', 'get_code', 'variant', 'views', 'day')
    inlines = (VarintViewSourceInline,)
