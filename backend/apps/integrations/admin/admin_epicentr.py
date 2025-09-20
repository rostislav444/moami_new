from django.contrib import admin
from apps.integrations.models.models_epicentr import EpicentrCategories, EpicentrAttributeSet, EpicentrAttribute, EpicentrAttributeGroup, EpicentrAttributeOption, EpicentrProductAttribute


@admin.register(EpicentrCategories)
class EpicentrCategoriesAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")


class EpicentrAttributeInline(admin.TabularInline):
    model = EpicentrAttribute
    extra = 0
    fields = ("name", "code")
    readonly_fields = ("name", "code")


class EpicentrAttributeGroupInline(admin.TabularInline):
    model = EpicentrAttributeGroup
    extra = 0
    fields = ("name", "code")
    readonly_fields = ("name", "code")
    show_change_link = True


@admin.register(EpicentrAttributeSet)
class EpicentrAttributeSetAdmin(admin.ModelAdmin):
    list_display = ("name", "code")
    search_fields = ("name", "code")
    inlines = [EpicentrAttributeGroupInline]


class EpicentrAttributeOptionInline(admin.TabularInline):
    model = EpicentrAttributeOption
    extra = 0
    fields = ("name", "code")
    readonly_fields = ("name", "code")


class EpicentrAttributeInline(admin.TabularInline):
    model = EpicentrAttribute
    extra = 0
    fields = ("name", "code", "type", "is_system", "is_required")
    readonly_fields = ("name", "code", "type", "is_system", "is_required")
    show_change_link = True


@admin.register(EpicentrAttributeGroup)
class EpicentrAttributeGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "attribute_set")
    search_fields = ("name", "code", "attribute_set__name", "attribute_set__code")
    inlines = [EpicentrAttributeInline]


@admin.register(EpicentrAttribute)
class EpicentrAttributeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "type", "is_system", "is_required", "attribute_group", "attribute_set")
    search_fields = ("name", "code", "attribute_group__name", "attribute_set__name")
    inlines = [EpicentrAttributeOptionInline]


@admin.register(EpicentrAttributeOption)
class EpicentrAttributeOptionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "attribute")
    search_fields = ("name", "code", "attribute__name", "attribute__code")


@admin.register(EpicentrProductAttribute)
class EpicentrProductAttributeAdmin(admin.ModelAdmin):
    list_display = ("product", "attribute", "get_value")
    autocomplete_fields = ("product", "attribute", "value_option", "value_options")

    def get_value(self, obj):
        if obj.attribute.type in ("select", "multiselect"):
            many = obj.value_options.all()
            if many:
                return ", ".join([o.name for o in many])
            return obj.value_option.name if obj.value_option else "-"
        if obj.attribute.type == "float":
            return obj.value_float
        if obj.attribute.type == "int":
            return obj.value_int
        if obj.attribute.type == "text":
            return obj.value_text
        if obj.attribute.type == "string":
            return obj.value_string
        if obj.attribute.type == "array":
            return obj.value_array
        return "-"

    get_value.short_description = "Value"


