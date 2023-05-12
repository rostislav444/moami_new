from django.contrib import admin

from apps.product.models import VariantSize


class VariantSizeInline(admin.TabularInline):
    model = VariantSize
    extra = 0

    # pass parent instance ij formfield_for_foreignkey
    def get_formset(self, request, obj=None, **kwargs):
        self.parent_object = obj
        return super().get_formset(request, obj, **kwargs)

    # Filter size field queryset by size group selected in product category
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if self.parent_object and db_field.name == 'size':
            size_group = self.parent_object.product.category.size_group
            if size_group:
                kwargs['queryset'] = size_group.sizes.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
