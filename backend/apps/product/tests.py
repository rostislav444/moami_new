from django.test import TestCase

from apps.product.factories import ProductFactory


class TestProduct(TestCase):
    def test_product(self):
        product = ProductFactory()
        print(product)
        self.assertTrue(product)

# Shell command to run tests:
# python manage.py test apps.product.tests.TestProduct




# class VariantImageTestCase(TestCase):
#     def setUp(self):
#         self.product = Product.objects.create(name='Test Product')
#         self.variant = Variant.objects.create(product=self.product, name='Test Variant')
#         self.image = Image.new('RGB', (100, 100), 'white')
#         self.image_file = BytesIO()
#         self.image.save(self.image_file, 'JPEG')
#         self.image_file.name = 'test.jpg'
#         self.image_file.seek(0)
#         self.variant_image = VariantImage.objects.create(
#             variant=self.variant,
#             image=SimpleUploadedFile('test.jpg', self.image_file.read())
#         )
#
#     def tearDown(self):
#         self.variant_image.delete()
#         self.variant.delete()
#         self.product.delete()
#
#     def test_variant_image_created(self):
#         variant_image_count = VariantImage.objects.count()
#         self.assertEqual(variant_image_count, 1)
#
#     def test_variant_image_slug(self):
#         self.assertEqual(self.variant_image.slug, self.variant.slug)
#
#     def test_variant_image_thumbnail_created(self):
#         variant_image_thumbnail_count = VariantImageThumbnail.objects.count()
#         self.assertEqual(variant_image_thumbnail_count, 4)
#
#     def test_variant_image_delete(self):
#         self.variant_image.delete()
#         variant_image_count = VariantImage.objects.count()
#         self.assertEqual(variant_image_count, 0)
#
#     def test_variant_image_thumbnail_delete(self):
#         thumbnail = self.variant_image.thumbnails.first()
#         thumbnail.delete()
#         variant_image_thumbnail_count = VariantImageThumbnail.objects.count()
#         self.assertEqual(variant_image_thumbnail_count, 3)
