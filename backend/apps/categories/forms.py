from django import forms

from apps.attributes.models import AttributeGroup
from apps.categories.models import CategoryAttributeGroup


class CategoryAttributeGroupForm(forms.ModelForm):
    class Meta:
        model = CategoryAttributeGroup
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)