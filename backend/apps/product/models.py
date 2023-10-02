import os
from io import BytesIO

from PIL import Image
from adminsortable.models import SortableMixin
from colorfield.fields import ColorField
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.text import slugify
from unidecode import unidecode
from mptt.models import MPTTModel, TreeForeignKey
from apps.abstract.fields import DeletableImageField, DeletableVideoField
from apps.attributes.models import Attribute, AttributeGroup, Composition
from apps.categories.models import Collections
from apps.sizes.models import Size
from apps.translation.models import Translatable

from django.core.exceptions import ValidationError
from django.utils.safestring import mark_safe



alphanumeric = RegexValidator(r'^[0-9a-zA-Z-]*$', 'Разрешенные символы 0-9, a-z, A-Z, -')


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
    code = ColorField(max_length=255, default='#FFFFFF')

    class Meta:
        verbose_name = 'Цвет'
        verbose_name_plural = 'Цвета'
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset('category')


class Product(Translatable):
    index = models.PositiveIntegerField(default=0, blank=False, null=False, verbose_name='Индекс')
    name = models.CharField(max_length=255, verbose_name='Название')

    category = models.ForeignKey('categories.Category', on_delete=models.CASCADE, related_name='products',
                                 verbose_name='Категория')
    collections = models.ManyToManyField(Collections, blank=True, related_name='products', verbose_name='Коллекции')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products', verbose_name='Бренд')
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='products', verbose_name='Страна')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    slug = models.SlugField(max_length=255, blank=True)
    price = models.PositiveIntegerField(default=0, verbose_name='Цена')
    promo_price = models.PositiveIntegerField(default=0, verbose_name='Акционная цена')
    old_price = models.PositiveIntegerField(default=0, verbose_name='Старая цена')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    rozetka_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Название Rozetka')
    rozetka_category = models.ForeignKey('integrations.RozetkaCategories', on_delete=models.CASCADE,
                                         related_name='products', verbose_name='Категория Rozetka', blank=True,
                                         null=True)

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['index']

    def save(self, *args, **kwargs):
        self.slug = slugify(unidecode(f'{self.name}-{self.brand.name}'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} id: {str(self.id)}'

    @property
    def get_rozetka_name(self):
        if self.rozetka_name:
            return self.rozetka_name
        return self.name

    @property
    def get_preferred_size_grid(self):
        return self.category.preferred_size_grid.name if self.category.preferred_size_grid else 'ua'

    def get_total_variant_views(self):
        return self.variants.aggregate(models.Sum('views__views'))['views__views__sum']

    get_total_variant_views.short_description = 'Просмотры'


class ProductVideo(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='video')
    video = DeletableVideoField(upload_to='videos', blank=True, null=True)

    class Meta:
        verbose_name = 'Видео'
        verbose_name_plural = 'Видео'

    def __str__(self):
        return f'{self.product.name} - {self.video.name}'


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


class ProductComment(MPTTModel):
    parent = TreeForeignKey('self', on_delete=models.CASCADE, related_name='answers', blank=True, null=True)
    user = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='comments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField(blank=True, null=True, verbose_name='Комментарий')
    rate = models.PositiveIntegerField(default=0, verbose_name='Оценка')
    buy_approved = models.BooleanField(default=False, verbose_name='Купил товар')
    active = models.BooleanField(default=True, verbose_name='Активный')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.name} - {str(self.created_at)}'


class ProductCommentImage(models.Model):
    comment = models.ForeignKey(ProductComment, on_delete=models.CASCADE, related_name='images')
    image = DeletableImageField(upload_to='comment_images', get_parent='comment', verbose_name="Файл")

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'


class CustomProperty(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='properties')
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'Свойство'
        verbose_name_plural = 'Свойства'

    def __str__(self):
        return f'{self.key}: {self.value}'


class VariantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('product')


class Variant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    slug = models.SlugField(max_length=512, unique=True, blank=True)
    color = models.ForeignKey(Color, on_delete=models.CASCADE, related_name='variants')
    code = models.CharField(max_length=255, validators=[alphanumeric])
    rozetka_code = models.CharField(max_length=255, blank=True, null=True)

    objects = VariantManager()

    class Meta:
        verbose_name = 'Вариант'
        verbose_name_plural = 'Варианты'
        ordering = ['product', 'color']

    def __str__(self):
        return f'{self.product.name} - {self.code}'

    @property
    def get_rozetka_code(self):
        if self.rozetka_code:
            return self.rozetka_code
        return self.code

    def get_absolute_url(self):
        domain = 'https://moami.com.ua'
        path = f'/product/{self.product.slug}-code-{self.code}'
        return domain + path

    def get_admin_url(self):
        domain = 'https://moami.com.ua'
        path = f'/admin/product/variant/{self.id}/change/'
        return domain + path

    @property
    def get_first_image_url(self):
        image = self.images.first()
        if image:
            return image.image.url
        return None

    @property
    def get_slug(self):
        return slugify(unidecode(f'{self.product.slug}-code-{self.code}'))

    def get_total_views(self):
        count = self.views.aggregate(models.Sum('views'))['views__sum']
        if count:
            return count
        return '-'

    def clean(self):
        if self.code:
            self.code = self.code.replace(' ', '-').upper()
            variant = Variant.objects.filter(code=self.code)
            if variant.exists():
                admin_url = variant.first().get_admin_url()
                if self.id != variant.first().id:
                    raise ValidationError(mark_safe(f'''
                        <span>Код варианта {self.code} уже существует.</span></br> 
                        <a href="{admin_url}" target="_blank">Ссылка на admin варианта {self.code}</a>
                    '''))
        self.slug = self.get_slug

    get_total_views.short_description = 'Просмотры'


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

    @property
    def get_size(self):
        sizes = self.size.get_interpretations_dict()
        preferred_size_grid = self.variant.product.get_preferred_size_grid

        if preferred_size_grid in sizes.keys():
            return sizes[preferred_size_grid]
        else:
            key = list(sizes.keys())[0]
            return sizes[key]

    def __str__(self):
        return self.get_size


class VariantImageManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('variant').prefetch_related('thumbnails')


class VariantVideo(models.Model):
    variant = models.OneToOneField(Variant, on_delete=models.CASCADE, related_name='video')
    video = DeletableVideoField(upload_to='videos', blank=True, null=True)

    class Meta:
        verbose_name = 'Видео'
        verbose_name_plural = 'Видео'

    def __str__(self):
        return f'{self.variant.code} - {self.video.name}'


class VariantImage(SortableMixin):
    index = models.PositiveIntegerField(default=0)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='images')
    image = DeletableImageField(upload_to='variant_images', get_parent='variant', verbose_name="Файл")
    slug = models.SlugField(max_length=255, blank=True)
    exclude_at_marketplace = models.BooleanField(default=False, verbose_name='Исключить на площадках')

    objects = VariantImageManager()

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'
        ordering = ['index']

    def save(self, *args, **kwargs):
        # If the object exists, get the current image value from the database
        image_changed = False
        if self.pk:
            orig = VariantImage.objects.get(pk=self.pk)
            if orig.image != self.image:
                image_changed = True

        if not self.pk:
            self.slug = slugify(f'{self.variant.code}-{timezone.now().timestamp()}')
        super().save(*args, **kwargs)

        # Call create_thumbnails() if the image has changed
        if image_changed:
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


class VariantViews(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='views')
    day = models.DateField(auto_now_add=True)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Просмотры'
        verbose_name_plural = 'Просмотры'

    def __str__(self):
        return f'{self.variant.code} - {self.day} - {self.views}'


# If Product slug changed rewrite Variant slug
@receiver(post_save, sender=Product)
def rewrite_variant_slug(sender, instance, **kwargs):
    for variant in instance.variants.all():
        variant.save()
