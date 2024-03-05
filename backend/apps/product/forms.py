from django import forms

from apps.attributes.models import AttributeGroup, Attribute
from apps.product.models import VariantSize, ProductAttribute


class VariantSizeAdminForm(forms.ModelForm):
    class Meta:
        model = VariantSize
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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


class ProductAttributeForm(forms.ModelForm):
    class Meta:
        model = ProductAttribute
        fields = '__all__'

    def get_attr_group_id(self, kwargs):
        if self.instance.attribute_group_id:
            return self.instance.attribute_group_id
        if 'initial' in kwargs:
            return kwargs['initial']['group']
        return None

    @staticmethod
    def fields_by_data_types():
        return {
            AttributeGroup.ATTR_TYPE_CHOICES[0][0]: 'value_multi_attributes',
            AttributeGroup.ATTR_TYPE_CHOICES[1][0]: 'value_single_attribute',
            AttributeGroup.ATTR_TYPE_CHOICES[2][0]: 'value_int',
            AttributeGroup.ATTR_TYPE_CHOICES[3][0]: 'value_str',
        }

    def hide_fields(self, attr_group):
        if attr_group.data_type is None:
            return

        field_types = self.fields_by_data_types()

        for key, field in field_types.items():
            if field != field_types[attr_group.data_type]:
                if field == 'value_multi_attributes':
                    self.fields[field].widget = forms.MultipleHiddenInput()
                    continue
                self.fields[field].widget = forms.HiddenInput()

    def init_attribute_group_fields(self, attr_group, mk_category_id):
        self.fields['attribute_group'].queryset = AttributeGroup.objects.filter(id=attr_group.id)
        self.fields['attribute_group'].empty_label = None
        self.hide_fields(attr_group)

        if attr_group.data_type == AttributeGroup.ATTR_TYPE_CHOICES[0][0]:
            self.fields['value_multi_attributes'].queryset = attr_group.attributes.filter(mk_categories__mk_category__id=mk_category_id)
            self.fields['value_single_attribute'].queryset = Attribute.objects.none()
        elif attr_group.data_type == AttributeGroup.ATTR_TYPE_CHOICES[1][0]:
            self.fields['value_multi_attributes'].queryset = Attribute.objects.none()
            self.fields['value_single_attribute'].queryset = attr_group.attributes.filter(mk_categories__mk_category__id=mk_category_id)
        else:
            self.fields['value_multi_attributes'].queryset = Attribute.objects.none()
            self.fields['value_single_attribute'].queryset = Attribute.objects.none()

    def __init__(self, *args, **kwargs):
        mk_category_id = None
        if 'mk_category_id' in kwargs:
            mk_category_id = kwargs.pop('mk_category_id')
        super(ProductAttributeForm, self).__init__(*args, **kwargs)
        group_id = self.get_attr_group_id(kwargs)

        if group_id and mk_category_id:
            attr_group = AttributeGroup.objects.get(id=group_id)
            self.init_attribute_group_fields(attr_group, mk_category_id)


class ProductAttributeFormSet(forms.BaseInlineFormSet):
    def __init__(self, *args, **kwargs):
        if kwargs['instance'].pk:
            instance = kwargs['instance']
            category = instance.category
            categories = category.get_ancestors(include_self=True)
            attr_groups = (AttributeGroup.objects
                           .filter(categories__category__in=categories)
                           .exclude(product_attribute_group__product__pk=kwargs['instance'].pk).distinct())

            kwargs.update({
                'initial': [
                    {'group': group.pk} for group in attr_groups
                ]
            })

        super(ProductAttributeFormSet, self).__init__(*args, **kwargs)

    def get_form_kwargs(self, index):
        kwargs = super(ProductAttributeFormSet, self).get_form_kwargs(index)
        if self.instance and hasattr(self.instance, 'category') and hasattr(self.instance.category, 'modna_kast_category'):
            kwargs.update({'mk_category_id':  self.instance.category.modna_kast_category.id})
        return kwargs
