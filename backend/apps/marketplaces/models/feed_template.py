from django.db import models


class FeedTemplate(models.Model):
    """
    Шаблон для генерации XML фида

    Типы шаблонов:
    - header: шапка XML файла
    - product: шаблон товара
    - variant: шаблон варианта товара
    - footer: подвал XML файла
    """

    TEMPLATE_TYPES = (
        ('header', 'Шапка (Header)'),
        ('product', 'Товар (Product)'),
        ('variant', 'Вариант (Variant)'),
        ('footer', 'Подвал (Footer)'),
    )

    marketplace = models.ForeignKey(
        'Marketplace',
        on_delete=models.CASCADE,
        related_name='feed_templates',
        verbose_name='Маркетплейс'
    )
    name = models.CharField(
        max_length=255,
        verbose_name='Название'
    )
    template_type = models.CharField(
        max_length=20,
        choices=TEMPLATE_TYPES,
        verbose_name='Тип шаблона'
    )
    content = models.TextField(
        verbose_name='Содержимое шаблона',
        help_text='Jinja2/Django template синтаксис'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Шаблон фида'
        verbose_name_plural = 'Шаблоны фидов'
        unique_together = ['marketplace', 'template_type']
        ordering = ['marketplace', 'template_type']

    def __str__(self):
        return f'{self.marketplace.name} - {self.get_template_type_display()}'
