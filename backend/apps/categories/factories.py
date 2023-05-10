import factory

from apps.attributes.factories import AttributeGroupFactory
from apps.categories.models import Category
from django.utils.text import slugify

from apps.sizes.factories import SizeGroupFactory
from apps.product.factories import ProductFactory
import random


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Faker('word')

    @factory.post_generation
    def attribute_groups(self, create, extracted, **kwargs):
        if not create:
            # Only set the related attribute_groups if a Category instance was created
            return

        if extracted:
            # Use the `set` method to assign the related attribute_groups to the Category instance
            self.attribute_groups.set(extracted)

        else:
            # Create a default set of AttributeGroup instances if none were provided
            size = kwargs.get('size', 5)
            attribute_groups = AttributeGroupFactory.create_batch(size)
            for attribute_group in attribute_groups:
                print(attribute_group.slug)
            self.attribute_groups.set(attribute_groups)

    @factory.post_generation
    def size_group(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.size_group = extracted
        else:
            self.size_group = SizeGroupFactory()

    @factory.post_generation
    def products(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.products.set(extracted)
        else:
            for i in range(random.randint(3, 10)):
                self.products.add(ProductFactory(name=f'{self.name}-{i}'))
