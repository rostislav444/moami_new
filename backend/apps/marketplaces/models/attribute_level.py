from django.db import models


class MarketplaceAttributeLevel(models.Model):
    """
    Привязка mp-атрибута к уровню заполнения для пары категорий.

    Определяет, где именно заполняется каждый атрибут маркетплейса:
    - product: на уровне товара
    - variant: на уровне варианта (цвет)
    - size: на уровне размера
    - brand: автоматически из product.brand через BrandMapping
    - skip: атрибут не используется
    """

    LEVEL_CHOICES = [
        ('product', 'Товар'),
        ('variant', 'Вариант'),
        ('size', 'Размер'),
        ('brand', 'Бренд (авто)'),
        ('color', 'Цвет (авто)'),
        ('country', 'Страна (авто)'),
        ('composition', 'Состав ткани (авто)'),
        ('skip', 'Пропустить'),
    ]

    category_mapping = models.ForeignKey(
        'marketplaces.CategoryMapping',
        on_delete=models.CASCADE,
        related_name='attribute_levels',
        verbose_name='Маппинг категории'
    )
    marketplace_attribute = models.ForeignKey(
        'marketplaces.MarketplaceAttribute',
        on_delete=models.CASCADE,
        related_name='level_assignments',
        verbose_name='Атрибут маркетплейса'
    )
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='product',
        verbose_name='Уровень заполнения'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Уровень атрибута маркетплейса'
        verbose_name_plural = 'Уровни атрибутов маркетплейсов'
        unique_together = ['category_mapping', 'marketplace_attribute']
        ordering = ['-marketplace_attribute__is_required', 'marketplace_attribute__name']

    def __str__(self):
        return f'{self.marketplace_attribute.name} → {self.get_level_display()}'
