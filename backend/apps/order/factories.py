from apps.order.models import Order, OrderDelivery
import factory
from factory.django import DjangoModelFactory
import random

class OrderDeliveryFactory(DjangoModelFactory):
    class Meta:
        model = OrderDelivery

    type = 'courier'
    city = factory.Faker('city')
    address = factory.Faker('address')


# gen random Uranian phone number
def gen_phone():
    return '+380' + str(random.randint(100000000, 999999999))


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order

    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    father_name = factory.Faker('last_name')
    email = factory.Faker('email')
    phone = factory.LazyFunction(gen_phone)
    status = 'new'
    delivery = factory.SubFactory(OrderDeliveryFactory)