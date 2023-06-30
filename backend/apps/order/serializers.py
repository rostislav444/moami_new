from rest_framework import serializers

from apps.order.models import Order, OrderDelivery, OrderDeliveryNewPost, OrderItem
from drf_writable_nested.serializers import WritableNestedModelSerializer


class OrderDeliveryNewPostSerializer(WritableNestedModelSerializer):
    class Meta:
        model = OrderDeliveryNewPost
        fields = ['region', 'city', 'department']


class OrderDeliverySerializer(WritableNestedModelSerializer):
    # newpost = OrderDeliveryNewPostSerializer(required=False)

    class Meta:
        model = OrderDelivery
        fields = ['delivery_type', 'address', 'comment']


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['size', 'quantity']


class OrderSerializer(WritableNestedModelSerializer):
    delivery = OrderDeliverySerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'first_name', 'last_name', 'father_name', 'phone', 'email', 'items', 'delivery', 'comment']
        read_only_fields = ['id']

