from django.db import models


class MarketplaceAttributeSet(models.Model):
    """Набор атрибутов маркетплейса (привязан к категории)"""

    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='attribute_sets',
        verbose_name='Маркетплейс'
    )
    marketplace_category = models.ForeignKey(
        'marketplaces.MarketplaceCategory',
        on_delete=models.CASCADE,
        related_name='attribute_sets',
        null=True,
        blank=True,
        verbose_name='Категория маркетплейса'
    )

    external_code = models.CharField(max_length=100, verbose_name='Код набора')
    name = models.CharField(max_length=255, verbose_name='Название')
    name_uk = models.CharField(max_length=255, blank=True, verbose_name='Название (укр)')

    class Meta:
        verbose_name = 'Набор атрибутов'
        verbose_name_plural = 'Наборы атрибутов'
        unique_together = ['marketplace', 'external_code']
        ordering = ['name']

    def __str__(self):
        return f'{self.marketplace.name}: {self.name}'

    @property
    def attributes_count(self):
        return self.attributes.count()

    @property
    def required_attributes_count(self):
        return self.attributes.filter(is_required=True).count()


class MarketplaceAttribute(models.Model):
    """Атрибут маркетплейса"""

    ATTR_TYPE_CHOICES = [
        ('select', 'Единичный выбор'),
        ('multiselect', 'Множественный выбор'),
        ('string', 'Строка'),
        ('text', 'Текст'),
        ('int', 'Целое число'),
        ('float', 'Дробное число'),
        ('boolean', 'Да/Нет'),
        ('array', 'Массив'),
    ]

    attribute_set = models.ForeignKey(
        MarketplaceAttributeSet,
        on_delete=models.CASCADE,
        related_name='attributes',
        verbose_name='Набор атрибутов'
    )

    external_code = models.CharField(max_length=100, verbose_name='Код атрибута')
    name = models.CharField(max_length=255, verbose_name='Название')
    name_uk = models.CharField(max_length=255, blank=True, verbose_name='Название (укр)')
    attr_type = models.CharField(
        max_length=20,
        choices=ATTR_TYPE_CHOICES,
        default='string',
        verbose_name='Тип'
    )
    is_required = models.BooleanField(default=False, verbose_name='Обязательный')
    is_system = models.BooleanField(default=False, verbose_name='Системный')

    # Группировка (для UI)
    group_name = models.CharField(max_length=255, blank=True, verbose_name='Группа')
    group_code = models.CharField(max_length=100, blank=True, verbose_name='Код группы')

    # Дополнительные данные
    suffix = models.CharField(max_length=50, blank=True, verbose_name='Суффикс', help_text='Например: мм, г')
    extra_data = models.JSONField(default=dict, blank=True, verbose_name='Доп. данные')

    class Meta:
        verbose_name = 'Атрибут маркетплейса'
        verbose_name_plural = 'Атрибуты маркетплейсов'
        unique_together = ['attribute_set', 'external_code']
        ordering = ['-is_required', 'name']

    def __str__(self):
        req = ' *' if self.is_required else ''
        return f'{self.name}{req} ({self.get_attr_type_display()})'

    @property
    def marketplace(self):
        return self.attribute_set.marketplace

    @property
    def has_options(self):
        return self.attr_type in ('select', 'multiselect')


class MarketplaceAttributeOption(models.Model):
    """Опция атрибута (для select/multiselect)"""

    attribute = models.ForeignKey(
        MarketplaceAttribute,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name='Атрибут'
    )

    external_code = models.CharField(max_length=100, verbose_name='Код опции')
    name = models.CharField(max_length=500, verbose_name='Название')
    name_uk = models.CharField(max_length=500, blank=True, verbose_name='Название (укр)')

    class Meta:
        verbose_name = 'Опция атрибута'
        verbose_name_plural = 'Опции атрибутов'
        unique_together = ['attribute', 'external_code']
        ordering = ['name']

    def __str__(self):
        return self.name


class AttributeMapping(models.Model):
    """Маппинг нашего атрибута на атрибут маркетплейса"""

    our_attribute = models.ForeignKey(
        'attributes.Attribute',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наш атрибут'
    )
    marketplace_attribute = models.ForeignKey(
        MarketplaceAttribute,
        on_delete=models.CASCADE,
        related_name='attribute_mappings',
        verbose_name='Атрибут маркетплейса'
    )

    # Для маппинга значений (наш атрибут -> опция маркетплейса)
    marketplace_option = models.ForeignKey(
        MarketplaceAttributeOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attribute_mappings',
        verbose_name='Опция маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Маппинг атрибута'
        verbose_name_plural = 'Маппинги атрибутов'
        unique_together = ['our_attribute', 'marketplace_attribute']

    def __str__(self):
        return f'{self.our_attribute.name} → {self.marketplace_attribute.name}'
