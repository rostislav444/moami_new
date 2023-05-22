import os
import zipfile
from io import BytesIO

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image

from apps.product.models import Variant


class Command(BaseCommand):
    help = 'Создает ZIP-архив с картинками продуктов по цветам и кодам.'

    def handle(self, *args, **options):
        mk_photo_zip_path = os.path.join(settings.MEDIA_ROOT, 'mk_photo.zip')

        # Если файл уже существует, удалите его
        if os.path.exists(mk_photo_zip_path):
            os.remove(mk_photo_zip_path)

        alphas = 'abcdefghijklmnopqrstuvwxyz12345678'

        # Создайте новый ZIP-файл
        with zipfile.ZipFile(mk_photo_zip_path, 'w') as zipf:
            # Пройдитесь по всем вариантам продуктов
            for product_variant in Variant.objects.all():
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
