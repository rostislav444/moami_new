from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ['size', 'quantity', 'price', 'total_price']
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'first_name', 'last_name', 'phone',  'status', 'total_price', 'total_quantity', 'created_at']
    list_filter = ['status']
    search_fields = ['first_name', 'last_name', 'phone', 'email']
    readonly_fields = ['id', 'total_price', 'total_quantity','comment', 'created_at']
    fieldsets = (
        ('Статус заказа', {
            'fields': ('status',)
        }),
        ('Данные о заказе', {
            'fields': ('total_price','total_quantity',)
        }),
        ('Покупатель', {
            'fields': ('first_name', 'last_name', 'father_name',)
        }),
        ('Контакты', {
            'fields': ('phone', 'email',)
        }),
        (None, {
            'fields': ('comment', 'created_at',)
        }),

    )
    inlines = [OrderItemInline]
