import factory
from apps.attributes.models import AttributeGroup, Attribute


class AttributeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Attribute

    name = factory.Faker('word')
    # slug = factory.LazyAttribute(lambda obj: slugify(obj.name))


class AttributeGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AttributeGroup

    name = factory.Faker('word')
    attributes = factory.RelatedFactoryList(
        AttributeFactory,
        factory_related_name='attribute_group',
        size=5
    )