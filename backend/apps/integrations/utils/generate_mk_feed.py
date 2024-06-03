import os
import sys
from datetime import datetime

from django.db.models import Prefetch
from django.db.models import Q
from django.template.loader import get_template
from django.utils import translation

from apps.integrations.models import RozetkaCategories
from apps.integrations.serializers import RozetkaCategoriesSerializer
from apps.integrations.serializers.serializers_modna_kasta_xml import ModnaKastaXMLProductSerializer
from apps.product.models import Product, ProductAttribute
from project import settings

feed_directory = os.path.join(settings.MEDIA_ROOT, 'feed')


def generate_mk_feed(feed_type):
    translation.activate('ru')

    feed_types = ['rozetka', 'epicentr', 'leboutique', 'modna_kasta']
    if feed_type not in feed_types:
        raise ValueError('Feed type is not supported')

    template_path = 'feed/' + feed_type

    paths = {
        'feed_tpl': 'feed/%s/feed.xml' % feed_type,
        'product_tpl': 'feed/%s/product.xml' % feed_type,
        'categories_tpl': 'feed/%s/categories.xml' % feed_type,
        'feed_xml': os.path.join(feed_directory, '%s.xml' % feed_type),
        'categories_xml': os.path.join(feed_directory, 'categories.xml'),
        'products_xml': os.path.join(feed_directory, 'products.xml'),
    }

    if not template_path:
        raise ValueError('Feed type is not supported')

    if not os.path.exists(feed_directory):
        os.makedirs(feed_directory)

    def render_categories_xml():
        def get_categories_data():
            categories = RozetkaCategories.objects.all().distinct()
            categories_serializer = RozetkaCategoriesSerializer(categories, many=True)
            return categories_serializer.data

        def render_categories(categories):
            template = get_template( paths['categories_tpl'])
            return template.render(context={'categories': categories})

        categories_data = get_categories_data()
        response = render_categories(categories_data)

        with open(paths['categories_xml'], 'w') as f:
            f.write(response)

    def render_products_xml():
        def get_product_attributes():
            return ProductAttribute.objects.select_related('attribute_group').filter(
                Q(value_multi_attributes__isnull=False) |
                Q(value_single_attribute__isnull=False) |
                Q(value_int__isnull=False) |
                Q(value_str__isnull=False)
            ).prefetch_related(
                'value_single_attribute',
                'value_multi_attributes'
            ).distinct()

        def get_products_qs():
            product_attributes = get_product_attributes()
            qs = Product.objects.select_related('brand', 'category', 'country').prefetch_related(
                'variants',
                'variants__images',
                'variants__sizes__size',
                'variants__color__translations',
                'compositions__composition',
                Prefetch('attributes', queryset=product_attributes),
            ).filter(
                rozetka_category__isnull=False,
                category__modna_kast_category__isnull=False
            ).exclude(variants__isnull=True).distinct()

            if feed_type == 'modna_kasta':
                qs = qs.exclude(brand__name__in=['Hasla', 'Tianqi&tianqi', 'Black Gold', 'PRL Jeans.CO']).exclude(
                    variants__sizes__size__interpretations__value='One size').exclude(
                    category__id__in=[38, 39]).distinct()

            return qs

        def get_products_data_generator(products):
            for product in products.iterator():
                yield ModnaKastaXMLProductSerializer(product).data

        def render_product(product):
            template = get_template(paths['product_tpl'])
            rendered_template = template.render(context={'product': product})
            return rendered_template.strip()

        def write_file(products_data, products_qty):
            with open(paths['products_xml'], 'w') as _:
                pass

            with open(paths['products_xml'], 'w') as products_feed_file:
                count = 0
                for product_data in products_data:
                    count += 1
                    product_xml = render_product(product_data)
                    products_feed_file.write(product_xml + '\n')
                    sys.stdout.write("\r%d%%" % float(count / products_qty * 100))
                    sys.stdout.flush()

        products_qs = get_products_qs()
        products_data_generator = get_products_data_generator(products_qs)

        write_file(products_data_generator, products_qs.count())

    def write_final_feed():
        final_xml_path = paths['feed_xml']

        with (open(paths['categories_xml'], 'r', encoding='utf-8') as categories_xml,
              open(paths['products_xml'], 'r', encoding='utf-8') as products_xml):

            template = get_template(template_path)
            categories_content = categories_xml.read()
            products_content = products_xml.read()

            rendered_template = template.render(context={
                'categories_xml': categories_content,
                'products_xml': products_content,
                'time': datetime.now()
            })

            with open(final_xml_path, 'w', encoding='utf-8') as feed:
                feed.write(rendered_template)

            # Remove useless files
            for path in [paths['categories_xml'], paths['products_xml']]:
                if os.path.exists(path):
                    os.remove(path)

        print(feed_type + ' feed is generated')

    render_categories_xml()
    render_products_xml()
    write_final_feed()

    return True
