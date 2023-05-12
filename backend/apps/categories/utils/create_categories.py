from apps.categories.models import Category
from apps.sizes.models import SizeGroup
from apps.product.factories import ProductFactory
from apps.categories.data.categories import categories


def create_category_products(category):
    ProductFactory.create_batch(10, category=category)


def create_categories():
    def recursive(categories, parent=None):
        for item in categories:
            category, _ = Category.objects.get_or_create(name=item['name'], parent=parent)
            if 'size_group' in item:
                print('item size_group ', item['size_group'])
                size_group = SizeGroup.objects.get(slug=item['size_group'])
                category.size_group = size_group
                category.save()
                # create_category_products(category)
            if 'children' in item:
                recursive(item['children'], category)

    recursive(categories)
