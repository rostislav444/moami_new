from apps.categories.models import Category
from apps.sizes.models import SizeGroup
from apps.product.factories import ProductFactory

categories = [{
    'name': 'Женская одежда',
    'children': [
        {'name': 'Блузы', 'size_group': 'Блузы женские'},
        {'name': 'Джинсы', 'size_group': 'Джинсы женские'}
    ]
}, {'name': 'Обувь', 'size_group': 'Обувь женская'}]


def create_category_products(category):
    ProductFactory.create_batch(10, category=category)


def create_categories():
    def recursive(categories, parent=None):
        for item in categories:
            category, _ = Category.objects.get_or_create(name=item['name'], parent=parent)
            if 'size_group' in item:
                size_group = SizeGroup.objects.get(name=item['size_group'])
                category.size_group = size_group
                category.save()
                create_category_products(category)
            if 'children' in item:
                recursive(item['children'], category)

    recursive(categories)
