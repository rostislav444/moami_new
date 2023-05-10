import json

from django.urls import reverse
from rest_framework import status

from apps.cart.tests import CartTestCase
from apps.order.factories import OrderFactory
from apps.order.serializers import OrderSerializer


class OrderTestCase(CartTestCase):
    def setUp(self):
        super(OrderTestCase, self).setUp()
        self.order = OrderFactory.stub()

    def test_order_list(self):
        response = self.client.get(reverse('order-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_order_create(self):
        self.add_to_cart()

        data = OrderSerializer(self.order).data

        # create new order
        response = self.client.post(reverse('order-list'), data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response_data = response.data
        self.assertEqual(len(response_data['items']), 1)

        # check that cart is empty
        response = self.client.get('/cart/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        json_response = response.json()
        self.assertEqual(json_response['quantity'], 0)
        self.assertEqual(json_response['total'], 0)
        self.assertEqual(len(json_response['items']), 0)


# Shell script:
# python manage.py test apps.order.tests.OrderTestCase.test_order_create
