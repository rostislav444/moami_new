from rest_framework import viewsets
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from apps.order.models import Order
from apps.order.serializers import OrderSerializer, OrderSimpleSerializer
from apps.product.models import VariantSize


class OrderViewSet(viewsets.ModelViewSet, CreateModelMixin, GenericViewSet):
    queryset = Order.objects.all()
    authentication_classes = []
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderSimpleSerializer
        return OrderSerializer


class CheckSizesAvailability(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        response = []

        for item in data:
            try:
                size = VariantSize.objects.get(id=item['id'])
                if size.stock >= item['quantity']:
                    response.append(item)
                else:
                    response.append({
                        'id': item['id'],
                        'quantity': size.stock
                    })
            except VariantSize.DoesNotExist:
                pass
        return Response(response)
