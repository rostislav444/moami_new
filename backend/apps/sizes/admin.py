from django.contrib import admin
# from nested_inline.admin import NestedStackedInline, NestedModelAdmin, NestedTabularInline
from django.utils.html import format_html

from apps.sizes.forms import SizeInterpretationForm
from apps.sizes.models import SizeGroup, SizeGrid, Size, SizeInterpretation, SizeProperty, SizePropertyValue


@admin.register(SizeGrid)
class SizeGridAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    search_fields = ('name', 'slug')
    ordering = ('order', 'name')


class SizePropertyValueInline(admin.StackedInline):
    model = SizePropertyValue
    extra = 0
    # fk_name = 'size'


class SizeInterpretationInline(admin.TabularInline):
    model = SizeInterpretation
    form = SizeInterpretationForm
    extra = 1
    fk_name = 'size'

    def get_min_num(self, request, obj=None, **kwargs):
        return request._obj.group.grids.count()

    def get_max_num(self, request, obj=None, **kwargs):
        return request._obj.group.grids.count()

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "grid" and request._obj is not None:
            kwargs["queryset"] = request._obj.group.grids.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'group', 'mk_id')
    search_fields = ('group__name',)
    ordering = ('group__name',)
    inlines = [SizeInterpretationInline, SizePropertyValueInline]

    def get_form(self, request, obj=None, **kwargs):
        request._obj = obj
        return super().get_form(request, obj, **kwargs)


class SizeInline(admin.TabularInline):
    model = Size
    extra = 0
    show_change_link = True
    fk_name = 'group'
    inlines = [SizeInterpretationInline, SizePropertyValueInline]

    def link_field(self, obj):
        link = '/admin/sizes/size/%s/change/' % obj.id
        return format_html('<a href="%s">Edit</a>' % (link,))

    link_field.short_description = 'link'
    link_field.allow_tags = True

    fields = ('order', 'link_field', 'mk_id')
    readonly_fields = ('link_field', 'mk_id')


@admin.register(SizeProperty)
class SizePropertyAdmin(admin.ModelAdmin):
    pass


class SizePropertyInline(admin.StackedInline):
    model = SizeProperty
    extra = 0
    show_change_link = True


@admin.register(SizeGroup)
class SizeGroupAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    ordering = ('name',)
    inlines = [SizePropertyInline, SizeInline]
