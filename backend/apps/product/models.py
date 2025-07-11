from adminsortable.models import SortableMixin
from ckeditor.fields import RichTextField
from colorfield.fields import ColorField
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils.safestring import mark_safe
from django.utils.text import slugify
from mptt.models import MPTTModel, TreeForeignKey
from unidecode import unidecode
from django.core.exceptions import ObjectDoesNotExist
from apps.abstract.fields import DeletableImageField, DeletableVideoField
from apps.abstract.models import ImageWithThumbnails
from apps.attributes.models import Attribute, AttributeGroup, Composition
from apps.categories.models import Collections
from apps.sizes.models import Size
from apps.translation.models import Translatable
from project import settings

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
    mk_id = models.CharField(max_length=24, null=True, blank=True)

    class Meta:
        verbose_name = 'Страна'
        verbose_name_plural = 'Страны'
        ordering = ['name']

    def __str__(self):
        if self.mk_id:
            return f'{self.name } ({self.mk_id})'
        return self.name


class Color(Translatable):
    name = models.CharField(max_length=255)
    code = ColorField(max_length=255, default='#FFFFFF')
    mk_id = models.CharField(max_length=24, null=True, blank=True)

    class Meta:
        verbose_name = 'Цвет'
        verbose_name_plural = 'Цвета'
        ordering = ['name']

    def __str__(self):
        if self.mk_id:
            return f'{self.name} ({self.mk_id})'
        return self.name


class ProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()


class Product(Translatable):
    index = models.PositiveIntegerField(default=0, blank=False, null=False, verbose_name='Индекс')
    name = models.CharField(max_length=255, verbose_name='Название')

    category = models.ForeignKey('categories.Category', on_delete=models.CASCADE, related_name='products',
                                 verbose_name='Категория')
    collections = models.ManyToManyField(Collections, blank=True, related_name='products', verbose_name='Коллекции')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products', verbose_name='Бренд')
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='products', verbose_name='Страна')
    code = models.CharField(max_length=255, validators=[alphanumeric], blank=True, null=True, verbose_name='Код товара')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    extra_description = RichTextField(blank=True, null=True, verbose_name='Дополнительное описание')
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

    mk_attributes_copy_to = models.ManyToManyField('self', blank=True,
                                                   help_text='Список товаров из тойже категории в которые будет '
                                                             'осуществлено копирование выбранных атрибутов Модна Каста',
                                                   verbose_name='Скопировать набор атрибутов в товары')
    mk_attributes_copy = models.BooleanField(default=False, verbose_name='Применить копирование аттрибутов')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['index']

    def save(self, *args, **kwargs):
        self.slug = slugify(unidecode(f'{self.name}-{self.brand.name}'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} id: {str(self.id)}'

    def get_rozetka_name(self, lang_code='ru'):
        attr_name = 'get_translation__rozetka_name__' + lang_code
        value = getattr(self, attr_name)
        if value:
            return value
        attr_name = 'get_translation__name__' + lang_code
        return getattr(self, attr_name)

    @property
    def get_preferred_size_grid(self):
        return self.category.preferred_size_grid.name if self.category.preferred_size_grid else 'ua'

    def get_total_variant_views(self):
        return self.variants.aggregate(models.Sum('views__views'))['views__views__sum']

    get_total_variant_views.short_description = 'Просмотры'

    def get_product_code(self):
        if self.code:
            return self.code
        first_variant = self.variants.first()
        return first_variant.code if first_variant else None


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
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE, verbose_name='Тип',
                                        related_name='product_attribute_group')
    # Attribute values dependant on attribute_group data type selected
    value_single_attribute = models.ForeignKey(Attribute, blank=True, null=True, on_delete=models.CASCADE,
                                               related_name='single_attr', verbose_name='Единичный выбор')
    value_multi_attributes = models.ManyToManyField(Attribute, blank=True, related_name='multi_attr',
                                                    verbose_name='Множественный выбор')
    value_int = models.PositiveIntegerField(null=True, blank=True, verbose_name='Число')
    value_str = models.CharField(max_length=255, null=True, blank=True, verbose_name='Строка')

    class Meta:
        unique_together = ('product', 'attribute_group')
        verbose_name = 'Атрибут'
        verbose_name_plural = 'Атрибуты'

    def __str__(self):
        attr_group = self.attribute_group
        value = self.get_attribute_string_value()
        return attr_group.name + ' - ' + value if value else ''

    @property
    def get_attribute_ids(self):
        attr_type = self.attribute_group.data_type

        if attr_type == AttributeGroup.ATTR_TYPE_CHOICES[0][0] and self.value_multi_attributes.count():
            return [int(choice.mk_id) for choice in self.value_multi_attributes.all()]
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[1][0] and self.value_single_attribute:
            return [int(self.value_single_attribute.mk_id)]
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[2][0] and self.value_int:
            return self.value_int
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[3][0] and self.value_str:
            return self.value_str
        return None

    def get_attribute_string_value(self, lang='ru'):
        attr_type = self.attribute_group.data_type
        value = None

        def get_language(item, field_name):
            if lang == settings.LANGUAGE_CODE:
                return getattr(item, field_name)
            else:
                return getattr(item, 'get_translation__' + field_name + '__' + lang)

        if attr_type == AttributeGroup.ATTR_TYPE_CHOICES[0][0] and self.value_multi_attributes.count():
            value = ', '.join(
                [get_language(choice, 'name') for choice in self.value_multi_attributes.all()])
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[1][0] and self.value_single_attribute:
            value = get_language(self.value_single_attribute, 'name')
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[2][0] and self.value_int:
            value = str(self.value_int)
        elif attr_type == AttributeGroup.ATTR_TYPE_CHOICES[3][0] and self.value_str:
            value = self.value_str

        return value


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
    def get_code_slug(self):
        return slugify(unidecode(f'{self.code}'))

    @property
    def get_effective_code(self):
        if self.product.code:
            return self.product.code
        if self.color.mk_id:
            return self.code + '-' + self.color.mk_id
        return self.code

    @property
    def get_rozetka_code(self):
        if self.rozetka_code:
            return self.rozetka_code
        return self.code

    @property
    def get_composition(self):
        compositions = []
        for item in self.product.compositions.all():
            compositions.append(str(item.value) + '% ' + item.composition.name)
        return ', '.join(compositions)

    @property
    def get_composition_uk(self):
        compositions = []
        for item in self.product.compositions.all():
            try:
                compositions.append(str(item.value) + '% ' + item.composition.translations.get(language_code='uk').name)
            except ObjectDoesNotExist:
                compositions.append(str(item.value) + '% ' + item.composition.name)
        return ', '.join(compositions)

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


class VariantMkUpdateStatus(models.Model):
    variant = models.OneToOneField(Variant, on_delete=models.CASCADE)
    status = models.CharField(max_length=64, null=True, blank=True)
    time = models.DateTimeField(auto_now=True)
    response = models.JSONField(default=dict, null=True, blank=True)


class VariantAttribute(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='attributes')
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE)
    attributes = models.ManyToManyField(Attribute, blank=True)

    class Meta:
        unique_together = ('variant', 'attribute_group')
        verbose_name = 'Атрибут'
        verbose_name_plural = 'Атрибуты'


class VariantSize(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='sizes')
    size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='variants')
    max_size = models.ForeignKey(Size, on_delete=models.CASCADE, related_name='max_sizes', null=True, blank=True)
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

    def get_size_value(self, sizes):
        preferred_size_grid = self.variant.product.get_preferred_size_grid

        if preferred_size_grid in sizes.keys():
            return sizes[preferred_size_grid]
        else:
            key = list(sizes.keys())[0]
            return sizes[key]

    @property
    def get_size(self):
        sizes = self.size.get_interpretations_dict()
        return self.get_size_value(sizes)

    @property
    def get_max_size(self):
        if self.max_size:
            sizes = self.max_size.get_interpretations_dict()
            return self.get_size_value(sizes)
        return None


    @property
    def sku(self):
        return '-'.join([self.variant.get_code_slug, self.get_size]).upper()

    @property
    def mk_sku(self):
        sku = self.sku
        if 'ONE SIZE' in sku:
            sku = sku.replace('ONE SIZE', 'onesize')
        return sku

    def __str__(self):
        return self.get_size


class VariantVideo(models.Model):
    variant = models.OneToOneField(Variant, on_delete=models.CASCADE, related_name='video')
    video = DeletableVideoField(upload_to='videos', blank=True, null=True)

    class Meta:
        verbose_name = 'Видео'
        verbose_name_plural = 'Видео'

    def __str__(self):
        return f'{self.variant.code} - {self.video.name}'


class VariantImage(ImageWithThumbnails, SortableMixin):
    index = models.PositiveIntegerField(default=0)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='images')
    exclude_at_marketplace = models.BooleanField(default=False, verbose_name='Исключить на площадках')

    class Meta:
        verbose_name = 'Изображение'
        verbose_name_plural = 'Изображения'
        ordering = ['index']

    def get_image_slug(self):
        return self.variant.code

    def __str__(self):
        return f'{self.variant.product.name} - {self.variant.code} - {self.image.name}'


class VariantImageThumbnail(models.Model):
    SIZE_CHOICES = (
        ('large', 'Large',),
        ('medium', 'Medium',),
        ('small', 'Small',),
        ('thumbnail', 'Thumbnail',),
    )

    variant_image = models.ForeignKey(
        VariantImage, on_delete=models.CASCADE, related_name='old_thumbnails'
    )
    size = models.CharField(max_length=50, choices=SIZE_CHOICES)
    image = DeletableImageField(upload_to='variant_thumbnails', get_parent='variant_image.variant')

    def __str__(self):
        return f'{self.variant_image.variant.code} ({self.size})'


class VariantViews(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name='views')
    day = models.DateField(auto_now_add=True, verbose_name='Дата')
    views = models.PositiveIntegerField(default=0, verbose_name='Просмотры')

    class Meta:
        verbose_name = 'Просмотры'
        verbose_name_plural = 'Просмотры'
        ordering = ['variant', 'day']

    def __str__(self):
        return f'{self.variant.code} - {self.day} - {self.views}'


class VarintViewSource(models.Model):
    variant_view = models.ForeignKey(VariantViews, on_delete=models.CASCADE, related_name='view_sources')
    utm_source = models.CharField(max_length=255, blank=True, null=True, verbose_name='UTM Source')
    views = models.PositiveIntegerField(default=0, verbose_name='Просмотры')


