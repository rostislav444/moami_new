from django.contrib import admin
from apps.sizes.models import SizeGroup, SizeGrid, Size, SizeInterpretation, SizeProperty, SizePropertyValue
# from nested_inline.admin import NestedStackedInline, NestedModelAdmin, NestedTabularInline
from django.utils.html import format_html


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
    extra = 0
    fk_name = 'size'


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'group',)
    search_fields = ('group__name',)
    ordering = ('group__name',)
    inlines = [SizeInterpretationInline, SizePropertyValueInline]


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

    fields = ('order', 'link_field',)
    readonly_fields = ('link_field',)


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
