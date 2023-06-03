import os
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.text import slugify
from PIL import Image
from unidecode import unidecode

from adminsortable.models import SortableMixin
from apps.abstract.fields import DeletableImageField
from apps.attributes.models import Attribute, AttributeGroup, Composition
from apps.categories.models import Collections
from apps.sizes.models import Size
from apps.translation.models import Translatable


class Brand(Translatable):
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Бренд'
        verbose_name_plural = 'Бренды'
        ordering = ['name']

    def __str__(self):
        return self.name


class Country(Translatable):
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Страна'
        verbose_name_plural = 'Страны'
        ordering = ['name']

    def __str__(self):
        return self.name


class Color(Translatable):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Цвет'
        verbose_name_plural = 'Цвета'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(Translatable):
    name = models.CharField(max_length=255, verbose_name='Название')
    category = models.ForeignKey('categories.Category', on_delete=models.CASCADE, related_name='products',
                                 verbose_name='Категория')

    rozetka_category = models.ForeignKey('integrations.RozetkaCategories', on_delete=models.CASCADE,
                                         related_name='products', verbose_name='Категория Rozetka', blank=True,
                                         null=True)
    taxonomy = models.ForeignKey('integrations.GoogleTaxonomy', on_delete=models.CASCADE, related_name='products',
                                    verbose_name='Категория Google Taxonomy', blank=True, null=True)
    collections = models.ManyToManyField(Collections, blank=True, related_name='products', verbose_name='Коллекции')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products', verbose_name='Бренд')
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='products', verbose_name='Страна')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    slug = models.SlugField(max_length=255, blank=True)
    price = models.PositiveIntegerField(default=0, verbose_name='Цена')
    old_price = models.PositiveIntegerField(default=0, verbose_name='Старая цена')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['name']

    def save(self, *args, **kwargs):
        self.slug = slugify(unidecode(f'{self.name}-{self.brand.name}'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} id: {str(self.id)}'


class ProductComposition(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='compositions')
    composition = models.ForeignKey(Composition, on_delete=models.CASCADE, related_name='products')
    value = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('product', 'composition')
        verbose_name = 'Состав'
        verbose_name_plural = 'Состав'

    def __str__(self):
        return f'{self.composition}: {str(self.value)}%'


class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE)
    attributes = models.ManyToManyField(Attribute, blank=True)

    class Meta:
        unique_together = ('product', 'attribute_group')
        verbose_name = 'Атрибут'
        verbose_name_plural = 'Атрибуты'

    # def __str__(self):
    #     return f'{str(self.product)} ({self.attribute_group.name})'


class CustomProperty(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='properties')
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Свойство'
        verbose_name_plural = 'Свойства'

    def __str__(self):
        return f'{self.key}: {self.value}'


class Variant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    slug = models.SlugField(max_length=512, unique=True, blank=True)
    color = models.ForeignKey(Color, on_delete=models.CASCADE, related_name='variants')
    code = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Вариант'
        verbose_name_plural = 'Варианты'
        ordering = ['product', 'color']

    def __str__(self):
        return f'{self.product.name} - {self.code}'

    @property
    def get_first_image_url(self):
        image = self.images.first()
        if image:
            return image.image.url
        return None

    @property
    def get_slug(self):
        return slugify(unidecode(f'p-{self.product.slug}-c-{self.code}'))

    def save(self, *args, **kwargs):
        self.code = self.code.replace(' ', '-').upper()
        self.slug = self.get_slug
        super().save(*args, **kwargs)


class VariantSize(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='sizes')
    size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='variants')
    stock = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'Размер'
        verbose_name_plural = 'Размеры'
        unique_together = ('variant', 'size')

    @property
    def get_size_name(self):
        interpretation = self.size.interpretations.first()
        if interpretation:
            return interpretation.value
        return self.size.__str__()

    def __str__(self):
        return f'{self.variant} ({self.get_size_name})'


class VariantImageManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('variant').prefetch_related('thumbnails')


class VariantImage(SortableMixin):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='images')
    image = DeletableImageField(upload_to='variant_images', get_parent='variant')
    slug = models.SlugField(max_length=255, blank=True)
    index = models.PositiveIntegerField(default=0, editable=False)

    objects = VariantImageManager()

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'
        ordering = ['index']

    def save(self, *args, **kwargs):
        if not self.pk:
            # if this is a new instance, generate a slug based on the variant's name and the current timestamp
            self.slug = slugify(f'{self.variant.code}-{timezone.now().timestamp()}')
        super().save(*args, **kwargs)

        self.create_thumbnails()

    def create_thumbnails(self):
        image = Image.open(self.image)
        width, height = image.size

        sizes = {
            'large': {'size': (1200, 1200), 'suffix': '_large'},
            'medium': {'size': (800, 800), 'suffix': '_medium'},
            'small': {'size': (400, 400), 'suffix': '_small'},
            'thumbnail': {'size': (200, 200), 'suffix': '_thumbnail'},
        }

        ext_format_map = {
            '.jpg': {'format': 'JPEG', 'mime_type': 'image/jpeg'},
            '.jpeg': {'format': 'JPEG', 'mime_type': 'image/jpeg'},
            '.png': {'format': 'PNG', 'mime_type': 'image/png'},
            '.gif': {'format': 'GIF', 'mime_type': 'image/gif'},
            '.webp': {'format': 'WEBP', 'mime_type': 'image/webp'}
        }

        ext = os.path.splitext(self.image.name)[1].lower()

        try:
            format_info = ext_format_map[ext]
        except KeyError:
            return  # unsupported file format

        for size_name, size_options in sizes.items():
            thumbnail = image.copy()
            thumbnail.thumbnail(size_options['size'])
            thumbnail_file = BytesIO()

            thumbnail.save(thumbnail_file, format=format_info['format'])
            thumbnail_filename = f'{self.slug}{size_options["suffix"]}{ext}'
            thumbnail_file = SimpleUploadedFile(thumbnail_filename, thumbnail_file.getvalue(), format_info['mime_type'])

            # check if there is already a thumbnail for this size
            try:
                thumbnail_obj = self.thumbnails.get(size=size_name)
            except VariantImageThumbnail.DoesNotExist:
                thumbnail_obj = VariantImageThumbnail(variant_image=self, size=size_name)

            # if there is a thumbnail for this size, delete the old image file from the storage
            if thumbnail_obj.image and thumbnail_obj.image.name != thumbnail_filename:
                thumbnail_obj.image.delete()

            thumbnail_obj.image.save(thumbnail_filename, thumbnail_file, save=False)
            thumbnail_obj.save()

    def __str__(self):
        return f'{self.variant.product.name} - {self.variant.code} - {self.image.name}'


class VariantImageThumbnail(models.Model):
    SIZE_CHOICES = (
        ('large', 'Large'),
        ('medium', 'Medium'),
        ('small', 'Small'),
        ('thumbnail', 'Thumbnail'),
    )

    variant_image = models.ForeignKey(
        VariantImage, on_delete=models.CASCADE, related_name='thumbnails'
    )
    size = models.CharField(max_length=50, choices=SIZE_CHOICES)
    image = DeletableImageField(upload_to='variant_thumbnails', get_parent='variant_image.variant')

    def __str__(self):
        return f'{self.variant_image.variant.code} ({self.size})'


# If Product slug changed rewrite Variant slug
@receiver(post_save, sender=Product)
def rewrite_variant_slug(sender, instance, **kwargs):
    for variant in instance.variants.all():
        variant.save()
