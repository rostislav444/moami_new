from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from apps.categories.models import Category, CategoryAttributeGroup
from apps.product.admin.admin_variant import VariantInline
from apps.product.forms import ProductAttributeFormSet
from apps.product.models import Brand, Color, Country, CustomProperty, Product, ProductAttribute, ProductComposition, \
    ProductVideo
from django.utils.safestring import mark_safe

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('name',)


class ProductCompositionInline(admin.TabularInline):
    model = ProductComposition
    extra = 0


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    formset = ProductAttributeFormSet

    category_attribute_groups = None

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        if obj:
            categories = obj.category.get_ancestors(include_self=True)
            self.category_attribute_groups = CategoryAttributeGroup.objects.filter(category__in=categories).distinct()
        return formset

    def get_extra(self, request, obj=None, **kwargs):
        if self.category_attribute_groups:
            return self.category_attribute_groups.count()
        return 0

    def get_min_num(self, request, obj=None, **kwargs):
        if self.category_attribute_groups:
            return self.category_attribute_groups.filter(required=True).count()
        return 0

    def get_extra(self, request, obj=None, **kwargs):
        if self.category_attribute_groups:
            return self.category_attribute_groups.count()
        return 0


class ProductVideoInline(admin.TabularInline):
    model = ProductVideo
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
        if db_field.name == 'product':
            kwargs['queryset'] = Product.objects.filter(id=request.resolver_match.kwargs['object_id'])
        return super().formfield_for_foreignkey(db_field, request, **kwargs)



class CustomPropertyInline(admin.TabularInline):
    model = CustomProperty
    extra = 0


class CategoryFilter(SimpleListFilter):
    title = _('Category')

    template = 'admin/category_filter.html'

    parameter_name = 'category'

    def lookups(self, request, model_admin):
        queryset = Category.objects.all()
        values = []
        for category in queryset:
            values.append((category.pk, category.name))
        return values

    def queryset(self, request, queryset):
        if self.value():
            category = Category.objects.get(pk=self.value())
            descendants = category.get_descendants(include_self=True)
            queryset = queryset.filter(category__in=descendants)
        return queryset

    def choices(self, changelist):
        yield {
            "selected": self.value() is None,
            "query_string": changelist.get_query_string(remove=[self.parameter_name]),
            "display": _("All"),
        }
        for lookup, title in self.lookup_choices:
            category = Category.objects.get(pk=lookup)

            yield {
                "selected": self.value() == str(lookup),
                "query_string": changelist.get_query_string(
                    {self.parameter_name: lookup}
                ),
                "level": category.level,
                "display": title,
            }


@admin.register(Product)
class ProductAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ('index', 'name', 'get_varinats_images', 'category', 'brand', 'price', 'old_price',)
    list_filter = (CategoryFilter,)
    search_fields = ('name', 'category__name', 'brand__name', 'price', 'old_price',)
    readonly_fields = ('slug', 'get_varinats_images',)
    ordering = ['index']
    inlines = (ProductVideoInline, ProductCompositionInline, ProductAttributeInline, CustomPropertyInline, VariantInline,)

    def get_list_filter(self, request):
        filters = super().get_list_filter(request)
        for filter_instance in filters:
            if isinstance(filter_instance, CategoryFilter):
                filter_instance.extra_arg = self.instance.some_value
        return filters

    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'category', 'brand', 'country', 'collections')
        }),
        ('Интеграции', {
            'fields': ('rozetka_category', 'taxonomy',)
        }),
        ('Цена', {
            'fields': (('price', 'old_price'),)
        }),
        ('Описание', {
            'fields': ('description',)
        }),
    )

    def get_varinats_images(self, obj):
        ul_styles = {
            'display': 'grid',
            'grid-template-columns': 'repeat(3, 80px)',
            'grid-gap': '4px',
            'list-style': 'none',
            'padding': '0',
            'margin': '0',
        }
        ul_styles = ' '.join([f'{k}: {v};' for k, v in ul_styles.items()])

        li_styles = {
            'list-style': 'none',
            'padding': '0',
        }
        li_styles = ' '.join([f'{k}: {v};' for k, v in li_styles.items()])
        images = []
        for variant in obj.variants.all():
            variant_link = reverse('admin:product_variant_change', args=(variant.id,))
            images.append(f'''
                <a href="{variant_link}" target="_blank">
                    <li style='{li_styles}'>
                        <img style="object-fit: cover" src={variant.get_first_image_url} width='80' height='108'>
                    </li>
                </a>
            ''')
        html = f'''<ul style="{ul_styles}">{''.join(images)}</ul>'''
        return format_html(html)
