from drf_writable_nested.serializers import WritableNestedModelSerializer
from rest_framework import serializers

from apps.order.models import Order, OrderItem, OrderDelivery, OrderDeliveryNewPost, OrderDeliveryAddress
from apps.newpost.models import NewPostCities, NewPostDepartments


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['size', 'quantity']


class OrderDeliveryNewPostSerializer(WritableNestedModelSerializer):
    class Meta:
        model = OrderDeliveryNewPost
        fields = ['area', 'region', 'city', 'department']


class OrderDeliveryNewPostSimpleSerializer(serializers.Serializer):
    city = serializers.CharField(max_length=255)
    warehouse = serializers.CharField(max_length=255)

    def create(self, validated_data):
        delivery = self.context.get('delivery')
        if not delivery:
            raise serializers.ValidationError('Delivery is required')
            
        return OrderDeliveryNewPost.objects.create(
            delivery=delivery,
            city_text=validated_data['city'],
            warehouse_text=validated_data['warehouse']
        )
        
    def to_representation(self, instance):
        return {
            'city': instance.city_text,
            'warehouse': instance.warehouse_text
        }


class OrderDeliveryAddressSerializer(WritableNestedModelSerializer):
    class Meta:
        model = OrderDeliveryAddress
        fields = ['city', 'address']
        non_required_fields = ['city']


class OrderDeliveryAddressSimpleSerializer(serializers.Serializer):
    city = serializers.CharField(max_length=100, default='Київ')
    street = serializers.CharField(max_length=255)
    house = serializers.CharField(max_length=50)
    apartment = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    
    def create(self, validated_data):
        delivery = self.context.get('delivery')
        if not delivery:
            raise serializers.ValidationError('Delivery is required')
            
        address_parts = [
            validated_data['street'],
            validated_data['house']
        ]
        
        if validated_data.get('apartment'):
            address_parts.append(f"кв. {validated_data['apartment']}")
        
        address = ', '.join(address_parts)
        
        return OrderDeliveryAddress.objects.create(
            delivery=delivery,
            city=validated_data['city'],
            address=address
        )


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


class OrderDeliverySimpleSerializer(serializers.Serializer):
    delivery_type = serializers.ChoiceField(choices=OrderDelivery.DELIVERY_TYPES)
    comment = serializers.CharField(required=False, allow_blank=True, default='')
    newpost = OrderDeliveryNewPostSimpleSerializer(required=False)
    address = OrderDeliveryAddressSimpleSerializer(required=False)
    
    def validate(self, data):
        delivery_type = data.get('delivery_type')
        
        if delivery_type == 'newpost':
            if not data.get('newpost'):
                raise serializers.ValidationError('NewPost delivery requires newpost data')
            if data.get('address'):
                raise serializers.ValidationError('NewPost delivery should not have address data')
        elif delivery_type == 'address':
            if not data.get('address'):
                raise serializers.ValidationError('Address delivery requires address data')
            if data.get('newpost'):
                raise serializers.ValidationError('Address delivery should not have newpost data')
        else:
            raise serializers.ValidationError('Unknown delivery type')
        
        return data
    
    def create(self, validated_data):
        # Получаем order из контекста
        order = self.context.get('order')
        if not order:
            raise serializers.ValidationError('Order is required')
            
        delivery_type = validated_data['delivery_type']
        comment = validated_data.get('comment', '')
        
        delivery = OrderDelivery.objects.create(
            order=order,
            delivery_type=delivery_type,
            comment=comment
        )
        
        if delivery_type == 'newpost' and 'newpost' in validated_data:
            newpost_serializer = OrderDeliveryNewPostSimpleSerializer(
                data=validated_data['newpost'], 
                context={'delivery': delivery}
            )
            newpost_serializer.is_valid(raise_exception=True)
            newpost = newpost_serializer.save()
        
        elif delivery_type == 'address' and 'address' in validated_data:
            address_serializer = OrderDeliveryAddressSimpleSerializer(
                data=validated_data['address'], 
                context={'delivery': delivery}
            )
            address_serializer.is_valid(raise_exception=True)
            address = address_serializer.save()
        
        return delivery


class OrderSerializer(WritableNestedModelSerializer):
    delivery = OrderDeliverySerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'first_name', 'last_name', 'father_name', 'phone', 'email', 'items', 'delivery', 'comment']
        read_only_fields = ['id']


class OrderSimpleSerializer(serializers.ModelSerializer):
    delivery = OrderDeliverySimpleSerializer()
    items = OrderItemSerializer(many=True)
    father_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    class Meta:
        model = Order
        fields = ['id', 'first_name', 'last_name', 'father_name', 'phone', 'email', 'items', 'delivery', 'comment']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        delivery_data = validated_data.pop('delivery')
        items_data = validated_data.pop('items')
        
        order = Order.objects.create(**validated_data)
        
        delivery_serializer = OrderDeliverySimpleSerializer(data=delivery_data, context={'order': order})
        delivery_serializer.is_valid(raise_exception=True)
        delivery = delivery_serializer.save()
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order
