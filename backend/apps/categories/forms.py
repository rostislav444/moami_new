from django import forms

from apps.attributes.models import AttributeGroup
from apps.categories.models import CategoryAttributeGroup


class CategoryAttributeGroupForm(forms.ModelForm):
    class Meta:
        model = CategoryAttributeGroup
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None and self.instance.pk is not None:
            category = self.instance.category
            categories = category.get_ancestors(include_self=False)
            self.fields['attribute_group'].queryset = AttributeGroup.objects.exclude(
                categories__category__in=categories
            )
        else:
            self.fields['attribute_group'].queryset = AttributeGroup.objects.none()