import os
import zipfile
from io import BytesIO

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image

from apps.categories.models import Category
from apps.product.models import Variant


class Command(BaseCommand):
    help = 'Создает ZIP-архив с картинками продуктов по цветам и кодам.'

    def add_arguments(self, parser):
        parser.add_argument('category', type=str, help='Category to process.')

    def handle(self,  *args, **options):
        category_slug = options.get('category')
        if category_slug:
            filename = 'mk_photo_{}'.format(category_slug)
            category = Category.objects.get(slug=category_slug)
        else:
            filename = 'mk_photo'
            category = None

        mk_photo_zip_path = os.path.join(settings.MEDIA_ROOT, f'{filename}.zip')

        if os.path.exists(mk_photo_zip_path):
            os.remove(mk_photo_zip_path)

        alphas = 'abcdefghijklmnopqrstuvwxyz12345678'

        # Создайте новый ZIP-файл
        with zipfile.ZipFile(mk_photo_zip_path, 'w') as zipf:
            # Пройдитесь по всем вариантам продуктов
            variants = Variant.objects.filter(product__category=category) if category else Variant.objects.all()
            for product_variant in variants:
                # Создайте имя папки на основе кода и имени цвета
                folder_name = f"{product_variant.code}_{product_variant.color.name}"

                # Пройдитесь по всем изображениям варианта продукта
                for index, image in enumerate(product_variant.images.all().order_by('index')):
                    filename = f"{folder_name}/{alphas[index]}.jpg"

                    # Временное сохранение изображения в памяти
                    img_byte_arr = BytesIO()
                    img = Image.open(image.image.path)
                    img.save(img_byte_arr, format='JPEG')
                    img_byte_arr = img_byte_arr.getvalue()

                    print(filename)

                    # Добавьте изображение в ZIP-файл
                    zipf.writestr(filename, img_byte_arr)
