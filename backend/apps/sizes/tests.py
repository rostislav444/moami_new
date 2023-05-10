from django.test import TestCase
from apps.sizes.factories import SizeGroupFactory


class SizeGroupTestCase(TestCase):
        def test_size_group(self):
            size_group = SizeGroupFactory()
            print(size_group)
            self.assertTrue(size_group)

# Path: apps/sizes/tests.py
