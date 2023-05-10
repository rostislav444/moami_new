import factory
from factory.django import DjangoModelFactory
from faker import Faker
from apps.product.models import Product, Variant, Country, Brand, Color, VariantImage, VariantSize

fake = Faker()

COUNTRIES = ['Italy', 'France', 'Germany', 'Spain', 'United Kingdom', 'United States', 'China', 'Japan']

BRANDS = ['Gucci', 'Prada', 'Louis Vuitton', 'Chanel', 'Dior', 'Burberry', 'Hermes', 'Fendi', 'Versace', 'Goyard']


class CountryFactory(DjangoModelFactory):
    class Meta:
        model = Country

    name = factory.Iterator(COUNTRIES)


class BrandFactory(DjangoModelFactory):
    class Meta:
        model = Brand

    name = factory.Iterator(BRANDS)


class ColorFactory(DjangoModelFactory):
    class Meta:
        model = Color

    name = factory.LazyFunction(lambda: fake.color_name())
    code = factory.LazyFunction(lambda: fake.hex_color())


def generate_variant_code():
    random_letters = ''.join([fake.random_letter() for _ in range(2)]).upper()
    return f'{random_letters}-{fake.random_int(min=100000, max=999999)}'


class ImageFactory(DjangoModelFactory):
    class Meta:
        model = VariantImage

    image = factory.django.ImageField()


class VariantSizeFactory(DjangoModelFactory):
    class Meta:
        model = VariantSize

    stock = factory.LazyFunction(lambda: fake.random_int(min=1, max=5))


class VariantFactory(DjangoModelFactory):
    class Meta:
        model = Variant

    code = factory.LazyFunction(generate_variant_code)
    color = factory.SubFactory(ColorFactory)

    @factory.post_generation
    def create_images(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for image in extracted:
                self.images.add(image)
        else:
            num_images = fake.random_int(min=1, max=5)
            images = [ImageFactory.create(variant=self) for _ in range(num_images)]
            self.images.set(images)

    @factory.post_generation
    def create_sizes(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for size in extracted:
                self.sizes.add(size)
        else:
            size_group = self.product.category.size_group
            sizes = size_group.sizes.all()
            random_sizes = fake.random_elements(elements=list(sizes), length=fake.random_int(min=1, max=len(sizes)), unique=True)
            for size in random_sizes:
                VariantSizeFactory.create(variant=self, size=size)


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.LazyFunction(lambda: fake.name())
    description = fake.text()
    country = factory.SubFactory(CountryFactory)
    brand = factory.SubFactory(BrandFactory)
    price = factory.LazyFunction(lambda: fake.random_int(min=100, max=1000))
    old_price = factory.LazyFunction(lambda: fake.random_int(min=100, max=1000))

    @factory.post_generation
    def create_variants(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for variant in extracted:
                self.variants.add(variant)
        else:
            num_variants = fake.random_int(min=1, max=5)
            variants = VariantFactory.create_batch(size=num_variants, product=self)
            self.variants.set(variants)
