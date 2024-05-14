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

modna_kasta_feed_xml_path = os.path.join(feed_directory, 'modna_kasta.xml')
rozetka_feed_xml_path = os.path.join(feed_directory, 'rozetka.xml')
epicernt_feed_xml_path = os.path.join(feed_directory, 'epicentr.xml')


def render_categories_xml(categories_xml_path):
    categories_template_path = 'feed/mk_feed/categories.xml'

    def get_categories_data():
        categories = RozetkaCategories.objects.all().distinct()
        categories_serializer = RozetkaCategoriesSerializer(categories, many=True)
        return categories_serializer.data

    def render_categories(categories):
        template = get_template(categories_template_path)
        return template.render(context={'categories': categories})

    categories_data = get_categories_data()
    response = render_categories(categories_data)

    with open(categories_xml_path, 'w') as f:
        f.write(response)


def render_products_xml(products_xml_path, rozetka=False, epicentr=False):
    product_template_path = 'feed/mk_feed/product.xml'

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

        if rozetka == False:
            qs = qs.exclude(brand__name__in=['Hasla', 'Tianqi&tianqi', 'Black Gold', 'PRL Jeans.CO']).exclude(
                variants__sizes__size__interpretations__value='One size').exclude(category__id__in=[38, 39]).distinct()

        return qs

    def get_products_data_generator(products):
        for product in products.iterator():
            yield ModnaKastaXMLProductSerializer(product).data

    def render_product(product):
        template = get_template(product_template_path)
        rendered_template = template.render(context={
            'product': product,
            'rozetka': rozetka,
            'epicentr': epicentr
        })
        return rendered_template.strip()

    def write_file(products_data, products_qty):
        with open(products_xml_path, 'w') as _:
            pass

        with open(products_xml_path, 'w') as products_feed_file:
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


def write_final_feed(template_path, categories_xml_path, products_xml_path, rozetka, epicentr=False):
    if epicentr:
        final_xml_path = epicernt_feed_xml_path
    else:
        final_xml_path = rozetka_feed_xml_path if rozetka else modna_kasta_feed_xml_path

    with (open(categories_xml_path, 'r', encoding='utf-8') as categories_xml,
          open(products_xml_path, 'r', encoding='utf-8') as products_xml):

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
        for path in [categories_xml_path, products_xml_path]:
            if os.path.exists(path):
                os.remove(path)

        if epicentr:
            print('Epicentr feed been writen')
        else:
            print(f' {"Rozetka" if rozetka else "Modna Kasta"} feed been writen')


def generate_mk_feed(rozetka=False, epicentr=False):
    translation.activate('ru')
    template_path = 'feed/mk_feed/feed.xml'
    categories_xml_path = os.path.join(feed_directory, 'categories.xml')

    if epicentr:
        products_xml_path = os.path.join(feed_directory, 'product_epicentr.xml')
    else:
        products_xml_path = os.path.join(feed_directory, 'products.xml')


    print('epicentr', epicentr, products_xml_path)

    if not os.path.exists(feed_directory):
        os.makedirs(feed_directory)

    render_categories_xml(categories_xml_path)
    render_products_xml(products_xml_path, rozetka, epicentr)
    write_final_feed(template_path, categories_xml_path, products_xml_path, rozetka, epicentr)

    return True
