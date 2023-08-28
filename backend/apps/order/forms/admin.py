from django import forms

from apps.newpost.models import NewPostCities, NewPostDepartments, NewPostRegion
from apps.order.models import OrderItem, OrderDeliveryNewPost


class OrderItemForm(forms.ModelForm):
    class Meta:
        model = OrderItem
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            self.fields['size'].queryset = self.instance.size.variant.sizes.all()
        else:
            self.fields['size'].queryset = self.fields['size'].queryset.none()


class OrderDeliveryNewPostAdminForm(forms.ModelForm):
    class Meta:
        model = OrderDeliveryNewPost
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            self.fields['region'].queryset = NewPostRegion.objects.filter(area=self.instance.area)
            if self.instance.region:
                self.fields['city'].queryset = NewPostCities.objects.filter(region=self.instance.region)
            else:
                self.fields['city'].queryset = NewPostCities.objects.filter(area=self.instance.area)
            self.fields['department'].queryset = NewPostDepartments.objects.filter(city=self.instance.city).order_by(
                'warehouse_status', 'number'
            )
        else:
            self.fields['city'].queryset = NewPostCities.objects.none()
            self.fields['department'].queryset = NewPostDepartments.objects.none()
