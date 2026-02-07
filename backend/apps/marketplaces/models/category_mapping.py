from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class MarketplaceCategory(MPTTModel):
    """Категория маркетплейса (загружается из API/файла)"""

    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name='Маркетплейс'
    )
    parent = TreeForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
        verbose_name='Родительская категория'
    )

    external_id = models.CharField(max_length=100, verbose_name='Внешний ID')
    external_code = models.CharField(max_length=100, blank=True, verbose_name='Код категории')
    name = models.CharField(max_length=500, verbose_name='Название')
    name_uk = models.CharField(max_length=500, blank=True, verbose_name='Название (укр)')
    full_path = models.CharField(max_length=1000, blank=True, verbose_name='Полный путь')

    # Дополнительные данные (специфичные для маркетплейса)
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Доп. данные',
        help_text='Например: {"kind_id": 123, "affiliation_id": 456}'
    )

    has_children = models.BooleanField(default=False, verbose_name='Есть дочерние')
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Категория маркетплейса'
        verbose_name_plural = 'Категории маркетплейсов'
        unique_together = ['marketplace', 'external_id']
        ordering = ['name']

    class MPTTMeta:
        order_insertion_by = ['name']

    def __str__(self):
        return f'{self.marketplace.name}: {self.name}'

    def get_full_path(self):
        """Возвращает полный путь категории"""
        ancestors = self.get_ancestors(include_self=True)
        return ' > '.join([a.name for a in ancestors])


class CategoryMapping(models.Model):
    """Связь нашей категории с категорией маркетплейса"""

    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наша категория'
    )
    marketplace_category = models.ForeignKey(
        MarketplaceCategory,
        on_delete=models.CASCADE,
        related_name='mappings',
        verbose_name='Категория маркетплейса'
    )

    # Опциональные настройки для этой связи
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    custom_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Кастомное название',
        help_text='Переопределить название категории для этого маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Маппинг категории'
        verbose_name_plural = 'Маппинги категорий'
        unique_together = ['category', 'marketplace_category']

    def __str__(self):
        return f'{self.category.name} → {self.marketplace_category.name}'

    @property
    def marketplace(self):
        return self.marketplace_category.marketplace
