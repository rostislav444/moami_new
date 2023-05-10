from django.test import TestCase

from apps.categories.factories import CategoryFactory


class CategoryTestCase(TestCase):
    def test_category_creation(self):
        category = CategoryFactory()
        self.assertTrue(category.id)

        # Check if the category has attribute groups
        self.assertTrue(category.attribute_groups.count() > 0)

        # Check if the attribute groups have attributes
        for attribute_group in category.attribute_groups.all():
            self.assertTrue(attribute_group.attributes.count() > 0)

# Shell command:
# python manage.py test apps.categories.tests.CategoryTestCase.test_category_creation
