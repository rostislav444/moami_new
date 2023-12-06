import abc
import os
import uuid

from PIL import Image
from django.core.files.storage import default_storage
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils.text import slugify
from unidecode import unidecode

from project import settings


class NameSlug(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.slug = slugify(unidecode(self.name), allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ImageMeta(abc.ABCMeta, type(models.Model)):
    pass


class ImageField(models.FileField):
    @staticmethod
    def delete_old_file(model_instance, file_object):
        old_instance = model_instance.__class__.objects.get(pk=model_instance.pk)
        old_file = getattr(old_instance, 'image')

        if old_file and file_object.name != old_file.name:
            for thumb_path in [old_file.name, *model_instance.thumbnails.values()]:
                default_storage.delete(thumb_path)
            model_instance.thumbnails = {}

    def pre_save(self, model_instance, add):
        file_object = getattr(model_instance, self.name)
        if file_object and not add:
            self.delete_old_file(model_instance, file_object)
        return super().pre_save(model_instance, add)

    # Totally override FileField method generate_filename
    def generate_filename(self, instance, filename):
        app_name = instance.__class__._meta.app_label
        class_name = instance.__class__.__name__
        ext = filename.split('.')[-1]
        slug = instance.get_image_slug()
        _hex = str(uuid.uuid4())[:6]
        new_filename = f'{app_name}/{class_name}/{slug}/{_hex}.{ext}'
        return new_filename


class ImageModel(models.Model, metaclass=ImageMeta):
    image = ImageField()

    @abc.abstractmethod
    def get_image_slug(self):
        pass

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class ImageWithThumbnails(ImageModel):
    THUMBNAILS_SIZES = (
        ('l', (1200, 1200)),
        ('m', (800, 800)),
        ('s', (400, 400)),
        ('xs', (200, 200)),
    )

    thumbnails = models.JSONField(default=dict, blank=True)

    @abc.abstractmethod
    def get_image_slug(self):
        pass

    class Meta:
        abstract = True

    @staticmethod
    def get_ext_format_data(ext):
        data = {
            'jpg': {'format': 'JPEG', 'mime_type': 'image/jpeg'},
            'jpeg': {'format': 'JPEG', 'mime_type': 'image/jpeg'},
            'png': {'format': 'PNG', 'mime_type': 'image/png'},
            'gif': {'format': 'GIF', 'mime_type': 'image/gif'},
            'webp': {'format': 'WEBP', 'mime_type': 'image/webp'}
        }
        if ext in data:
            return data[ext]

        raise Exception('Image format incorrect')

    def remove_old_thumbnails(self):
        for thumb_path in self.thumbnails.values():
            default_storage.delete(thumb_path)
        self.thumbnails = {}

    def create_thumbnails(self):
        if len(self.thumbnails.keys()) > 0:
            return

        data = {}
        name, ext = self.image.name.split('.')
        props = self.get_ext_format_data(ext)
        image = Image.open(self.image)

        for key, value in self.THUMBNAILS_SIZES:
            thumbnail = image.copy()
            thumbnail.thumbnail(value)
            thumbnail_filename = f'{name}-{key}.{ext}'
            thumbnail.save(settings.MEDIA_ROOT + thumbnail_filename, format=props['format'])
            data[key] = thumbnail_filename

        self.thumbnails = data
        super().save()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        self.create_thumbnails()


@receiver(pre_delete)
def delete_image_file(sender, instance, **kwargs):
    if issubclass(sender, ImageWithThumbnails):
        paths = [instance.image.name, *instance.thumbnails.values()]

        for path in paths:
            default_storage.delete(path)

        dir_path = os.path.dirname(settings.MEDIA_ROOT + paths[0])
        if os.listdir(dir_path) == 0:
            default_storage.delete(dir_path)
