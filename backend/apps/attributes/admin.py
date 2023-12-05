from django.contrib import admin

from apps.attributes.models import AttributeGroup, Attribute, Composition


class AttributeInline(admin.TabularInline):
    model = Attribute
    extra = 0


@admin.register(AttributeGroup)
class AttributeGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'data_type')
    inlines = [AttributeInline]


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ('name', 'attribute_group')


@admin.register(Composition)
class CompositionAdmin(admin.ModelAdmin):
    list_display = ('name',)
