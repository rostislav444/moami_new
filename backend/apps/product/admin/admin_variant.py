from adminsortable2.admin import SortableTabularInline, SortableAdminMixin
from django.contrib import admin
from django.urls import reverse
from django.utils.safestring import mark_safe

from apps.product.admin.admin_variant_size import VariantSizeInline
from apps.product.models import Variant, VariantImage, VariantImageThumbnail, VariantVideo
from project import settings


class VariantInline(admin.TabularInline):
    model = Variant
    extra = 0
    show_change_link = True

    def get_image(self, obj):
        url = reverse('admin:product_variant_change', args=(obj.id,))
        return mark_safe(f'''
            <a href="{url}" target="_blank">
                <img src="{obj.get_first_image_url}" width="100" height="150" />
            </a>
        ''')

    def get_already_set_sizes_ul(self, obj):
        ul_style = {
            'display': 'grid',
            'grid-template-columns': 'repeat(3, 1fr)',
            'grid-gap': '4px',
            'list-style-type': 'none',
            'padding': '0',
        }
        li_style = {
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'border': '1px solid #ccc',
            'border-radius': '4px',
            'padding': '4px',
        }
        ul_style = ' '.join([f'{k}: {v};' for k, v in ul_style.items()])
        li_style = ' '.join([f'{k}: {v};' for k, v in li_style.items()])
        return mark_safe(f'''
            <ul style="{ul_style}">
                {"".join([f'<li style="{li_style}">{size.get_size}</li>' for size in obj.sizes.all()])}
            </ul>
        ''')

    get_image.short_description = 'Image'
    get_already_set_sizes_ul.short_description = 'Sizes'
    readonly_fields = ('get_image', 'get_total_views', 'get_already_set_sizes_ul', 'rozetka_code', 'slug')
    fields = ('get_image', 'get_already_set_sizes_ul', 'get_total_views', 'code', 'rozetka_code', 'color')


class VariantImageThumbnailInline(admin.TabularInline):
    model = VariantImageThumbnail
    extra = 0


# SortableTabularInline
class VariantImageInline(SortableTabularInline):
    model = VariantImage
    extra = 0

    def get_image(self, obj):
        if obj.image:
            thumb = obj.thumbnails.get('xs')
            url = settings.MEDIA_URL + thumb if thumb else obj.image.url
            return mark_safe(
                f'<img src="{url}" style="object-fit: cover" width="100" height="150" />'
            )
        return ''

    get_image.short_description = 'Изображение'

    fields = ('get_image', 'exclude_at_marketplace', 'image',)
    readonly_fields = ('get_image',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'variant':
            kwargs['queryset'] = Variant.objects.filter(product__id=request.resolver_match.kwargs['object_id'])
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class VariantVideoInline(admin.TabularInline):
    model = VariantVideo
    extra = 1

    def get_video(self, obj):
        if obj.video:
            return mark_safe(f'''<div>
                <video src="{obj.video.url}" width="300" height="450" style="object-fit: cover;"controls ></video>
            </div>''')
        return '-'

    get_video.short_description = 'Video'

    fields = ('get_video', 'video',)
    readonly_fields = ('get_video',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'variant':
            kwargs['queryset'] = Variant.objects.filter(product__id=request.resolver_match.kwargs['object_id'])
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Variant)
class VariantAdmin(SortableAdminMixin, admin.ModelAdmin):
    def product_link(self, obj):
        style = {
            'display': 'inline-block',
            'border': '2px solid #417690',
            'border-radius': '4px',
            'padding': '8px 16px',
        }
        style = ' '.join([f'{k}: {v};' for k, v in style.items()])
        url = reverse('admin:product_product_change', args=(obj.product.id,))
        return mark_safe(f'<a style="{style}" href="{url}">{obj.product.name}</a>')

    product_link.short_description = 'Product'

    fieldsets = (
        (None, {
            'fields': ('product_link', 'product', 'code', 'color', 'slug', 'get_total_views')
        }),
    )

    def get_image(self, obj):
        image = obj.images.first()
        if image:
            return mark_safe(f'<img src="{image.image.url}" width="100" height="150" />')
        return 'Edit'

    get_image.short_description = 'Image'

    list_display = ('get_image', 'get_total_views', 'code', 'rozetka_code', 'color')
    readonly_fields = ('get_image', 'product_link', 'slug', 'get_total_views',)
    search_fields = ('code', 'product__name')
    inlines = (VariantVideoInline, VariantImageInline, VariantSizeInline,)


@admin.register(VariantImage)
class VariantImageAdmin(admin.ModelAdmin):
    list_display = ('variant', 'image',)
    inlines = (VariantImageThumbnailInline,)
