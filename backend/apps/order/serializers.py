from drf_writable_nested.serializers import WritableNestedModelSerializer
from rest_framework import serializers

from apps.order.models import Order, OrderItem, OrderDelivery, OrderDeliveryNewPost, OrderDeliveryAddress


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['size', 'quantity']


class OrderDeliveryNewPostSerializer(WritableNestedModelSerializer):
    class Meta:
        model = OrderDeliveryNewPost
        fields = ['area', 'region', 'city', 'department']


class OrderDeliveryAddressSerializer(WritableNestedModelSerializer):
    class Meta:
        model = OrderDeliveryAddress
        fields = ['city', 'address']
        non_required_fields = ['city']


class OrderDeliverySerializer(WritableNestedModelSerializer):
    newpost = OrderDeliveryNewPostSerializer(required=False)
    address = OrderDeliveryAddressSerializer(required=False)

    class Meta:
        model = OrderDelivery
        fields = ['delivery_type', 'comment', 'address', 'newpost']

    def clean(self):
        print('clean')
        cleaned_data = super().clean()
        delivery_type = cleaned_data.get('delivery_type')
        address = cleaned_data.get('address')
        newpost = cleaned_data.get('newpost')
        print(delivery_type, address, newpost)
        if delivery_type == OrderDelivery.DELIVERY_TYPE_NEWPOST:
            if not newpost:
                raise serializers.ValidationError('NewPost delivery requires newpost data')
            if address:
                raise serializers.ValidationError('NewPost delivery requires newpost data')
        elif delivery_type == OrderDelivery.DELIVERY_TYPE_ADDRESS:
            if not address:
                raise serializers.ValidationError('Address delivery requires address data')
            if newpost:
                raise serializers.ValidationError('Address delivery requires address data')
        else:
            raise serializers.ValidationError('Unknown delivery type')


class OrderSerializer(WritableNestedModelSerializer):
    delivery = OrderDeliverySerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'first_name', 'last_name', 'father_name', 'phone', 'email', 'items', 'delivery', 'comment']
        read_only_fields = ['id']
