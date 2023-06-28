from django.db import models

from apps.abstract.fields import DeletableImageField
from apps.abstract.models import NameSlug
from apps.translation.models import Translatable


class HomeSlider(Translatable):
    SLIDE_TYPES = (
        ('image', 'Image'),
        ('mini_post', 'Mini Post'),
    )

    SLIDE_LINK_TYPES = (
        ('category', 'Категория'),
        ('collection', 'Коллекция'),
        ('product', 'Товар'),
        ('page', 'Страница'),
    )

    link_type = models.CharField(max_length=255, choices=SLIDE_LINK_TYPES, default='category')
    link = models.CharField(max_length=255, blank=True, null=True)
    slide_type = models.CharField(max_length=255, choices=SLIDE_TYPES)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image = DeletableImageField(upload_to='home_slider/')
    image_2 = DeletableImageField(upload_to='home_slider/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    exclude_translation=['link_type', 'link', 'slide_type']

    def __str__(self):
        if self.title:
            return self.title
        return 'Home Slider id {}'.format(self.id)

    class Meta:
        verbose_name = 'Баннер домашней страницы'
        verbose_name_plural = 'Баннеры домашней страницы'


class Pages(NameSlug, Translatable):
    description = models.TextField()

    class Meta:
        verbose_name = 'Текстовая страница'
        verbose_name_plural = 'Текстовые страницы'
