from django import forms

from apps.attributes.models import Attribute, AttributeGroup
from apps.product.models import ProductAttribute, VariantSize


class VariantSizeAdminForm(forms.ModelForm):
    class Meta:
        model = VariantSize
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        print(self.instance)

        if self.instance:
            self.fields['size'].queryset = self.instance.product.category.size_group.sizes.all()
            self.fields['size'].empty_label = None
            self.fields['size'].label = self.instance.product.category.size_group.name
            self.fields['size'].help_text = self.instance.product.category.size_group.name
        else:
            self.fields['size'].queryset = None
            self.fields['size'].empty_label = None
            self.fields['size'].label = 'Size'
            self.fields['size'].help_text = 'Size'


class ProductAttributeFormSet(forms.BaseInlineFormSet):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance:
            category = self.instance.category
            categories = category.get_ancestors(include_self=True)
            attr_groups = AttributeGroup.objects.filter(categories__category__in=categories).distinct()
            required_attr_groups = attr_groups

            self.min_num = required_attr_groups.count()
            self.max_num = attr_groups.count()

            for form, attr_group in zip(self.forms, required_attr_groups):
                form.fields['attribute_group'].initial = attr_group
                form.fields['attribute_group'].queryset = form.fields['attribute_group'].queryset.filter(id=attr_group.id)
                form.fields['attribute_group'].empty_label = None
                form.fields['attributes'].queryset = Attribute.objects.filter(attribute_group=attr_group)


