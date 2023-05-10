from apps.sizes.models import SizeGroup, Size, SizeGrid, SizeInterpretation, SizeProperty, SizePropertyValue
import factory
from django.utils.text import slugify

GRIDS = ['US', 'UK', 'EU', 'IT', 'FR', 'JP', 'CN', 'AU', 'RU', 'BR', 'MX', 'IN', 'KOR', 'TH', 'ID', 'VN']


class SizeGridFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SizeGrid

    name = factory.Iterator(GRIDS)


class SizeInterpretationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SizeInterpretation

    value = factory.Faker('word')


class SizeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Size

    order = factory.Faker('pyint')

    @factory.post_generation
    def interpretations(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.interpretations.set(extracted)
        else:
            for grid in self.group.grids.all():
                interpretation = SizeInterpretationFactory(grid=grid, size=self)
                self.interpretations.add(interpretation)


class SizeGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SizeGroup

    name = factory.Faker('word')
    slug = factory.LazyAttribute(lambda obj: slugify(obj.name))

    @factory.post_generation
    def size_grids(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.sgrids.set(extracted)
        else:
            size = kwargs.get('size', 5)
            size_grids = SizeGridFactory.create_batch(size)
            self.grids.set(size_grids)

    @factory.post_generation
    def sizes(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            self.sizes.set(extracted)
        else:
            size = kwargs.get('size', 5)
            sizes = SizeFactory.create_batch(size, group=self)
            self.sizes.set(sizes)
