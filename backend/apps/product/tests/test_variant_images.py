from io import BytesIO

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from apps.product.models import Product, Variant, VariantImage, VariantImageThumbnail
from apps.categories.factories import CategoryFactory


class ProductTestCase(TestCase):
    def setUp(self):
        self.category = CategoryFactory()
        self.product = Product.objects.create(name='Test Product', category=self.category)

    def test_variant_create(self):
        variant = Variant.objects.create(product=self.product, name='Test Variant')
        self.assertEqual(variant.name, 'Test Variant')

    def test_variant_image_create(self):
        variant = Variant.objects.create(product=self.product, name='Test Variant')
        image = Image.new('RGB', (100, 100), 'white')
        image_file = BytesIO()
        image.save(image_file, 'JPEG')
        image_file.name = 'test.jpg'
        image_file.seek(0)
        variant_image = VariantImage.objects.create(
            variant=variant,
            image=SimpleUploadedFile('test.jpg', image_file.read())
        )
        self.assertEqual(variant_image.image.name, 'test.jpg')

    def test_variant_image_thumbnail_create(self):
        variant = Variant.objects.create(product=self.product, name='Test Variant')
        image = Image.new('RGB', (100, 100), 'white')
        image_file = BytesIO()
        image.save(image_file, 'JPEG')
        image_file.name = 'test.jpg'
        image_file.seek(0)
        variant_image = VariantImage.objects.create(
            variant=variant,
            image=SimpleUploadedFile('test.jpg', image_file.read())
        )
        variant_image_thumbnail_count = VariantImageThumbnail.objects.count()
        self.assertEqual(variant_image_thumbnail_count, 4)

    def tearDown(self):
        self.product.delete()
        self.category.delete()
