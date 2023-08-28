from django.contrib import admin
from django.urls import reverse
from django.utils.safestring import mark_safe
from nested_inline.admin import NestedStackedInline, NestedModelAdmin

from .forms.admin import OrderDeliveryNewPostAdminForm, OrderItemForm
from .models import Order, OrderItem, OrderDelivery, OrderDeliveryNewPost, OrderDeliveryAddress


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    form = OrderItemForm
    fields = ['get_image', 'get_links', 'size', 'quantity', 'total_price']
    readonly_fields = ['get_image', 'get_links', 'total_price']
    extra = 0

    def get_image(self, obj):
        style = 'position: relative; display: block; border: 1px solid lightgrey;'
        return mark_safe(f'<img style="{style}" src="{obj.get_item_image}" width="100" height="150" />')

    def get_links(self, obj):
        admin_url = reverse('admin:product_variant_change', args=(obj.size.variant.id,))
        site_url = obj.size.variant.get_absolute_url()
        return mark_safe('''
            <ul style="list-style-type: none; padding: 0;">
                <li><a href="{}" target="_blank">Админка</a></li>
                <li><a href="{}" target="_blank">Сайт</a></li>
            </ul>
        '''.format(admin_url, site_url))

    get_image.short_description = 'Фото'
    get_links.short_description = 'Ссылки'



class OrderDeliveryAddressInline(NestedStackedInline):
    model = OrderDeliveryAddress
    extra = 0
    max_num = 1


class OrderDeliveryNewPostInline(NestedStackedInline):
    model = OrderDeliveryNewPost
    form = OrderDeliveryNewPostAdminForm
    extra = 0
    max_num = 1


class OrderDeliveryInline(NestedStackedInline):
    model = OrderDelivery
    extra = 0
    inlines = [OrderDeliveryNewPostInline, OrderDeliveryAddressInline]


@admin.register(Order)
class OrderAdmin(NestedModelAdmin):
    list_display = ['status', 'id', 'first_name', 'last_name', 'phone', 'status', 'total_price', 'total_quantity',
                    'created_at']
    list_filter = ['status']
    search_fields = ['first_name', 'last_name', 'phone', 'email']
    readonly_fields = ['id', 'total_price', 'total_quantity', 'comment', 'created_at']
    fieldsets = (
        ('Статус заказа', {
            'fields': ('status',)
        }),
        ('Покупатель', {
            'fields': ('first_name', 'last_name', 'father_name',)
        }),
        ('Данные о заказе', {
            'fields': (('total_price', 'total_quantity'),)
        }),

        ('Контакты', {
            'fields': ('phone', 'email',)
        }),
        (None, {
            'fields': ('comment', 'created_at',)
        }),
    )
    inlines = [OrderDeliveryInline, OrderItemInline]
