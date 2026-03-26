from django.db import models


class ProductMarketplaceConfig(models.Model):
    """Настройки товара для конкретного маркетплейса"""

    product = models.ForeignKey(
        'product.Product',
        on_delete=models.CASCADE,
        related_name='marketplace_configs',
        verbose_name='Товар'
    )
    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='product_configs',
        verbose_name='Маркетплейс'
    )

    is_active = models.BooleanField(default=True, verbose_name='Активен')
    custom_name = models.CharField(max_length=500, blank=True, verbose_name='Кастомное название')
    custom_name_uk = models.CharField(max_length=500, blank=True, verbose_name='Кастомное название (укр)')
    custom_description = models.TextField(blank=True, verbose_name='Кастомное описание')
    custom_description_uk = models.TextField(blank=True, verbose_name='Кастомное описание (укр)')

    # Переопределение категории (если отличается от стандартного маппинга)
    category_override = models.ForeignKey(
        'marketplaces.MarketplaceCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_overrides',
        verbose_name='Переопределить категорию'
    )

    # Статус экспорта
    last_exported = models.DateTimeField(null=True, blank=True, verbose_name='Последний экспорт')
    export_errors = models.JSONField(default=list, blank=True, verbose_name='Ошибки экспорта')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Настройки товара для маркетплейса'
        verbose_name_plural = 'Настройки товаров для маркетплейсов'
        unique_together = ['product', 'marketplace']

    def __str__(self):
        return f'{self.product.name} @ {self.marketplace.name}'


class ProductMarketplaceAttribute(models.Model):
    """Значение атрибута товара для маркетплейса"""

    product = models.ForeignKey(
        'product.Product',
        on_delete=models.CASCADE,
        related_name='marketplace_attributes',
        verbose_name='Товар'
    )
    marketplace_attribute = models.ForeignKey(
        'marketplaces.MarketplaceAttribute',
        on_delete=models.CASCADE,
        related_name='product_values',
        verbose_name='Атрибут маркетплейса'
    )

    # Уровень: variant или size (null = product level)
    variant = models.ForeignKey(
        'product.Variant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='marketplace_attributes',
        verbose_name='Вариант'
    )
    variant_size = models.ForeignKey(
        'product.VariantSize',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='marketplace_attributes',
        verbose_name='Размер варианта'
    )

    # Значения разных типов
    value_option = models.ForeignKey(
        'marketplaces.MarketplaceAttributeOption',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='single_product_values',
        verbose_name='Значение (выбор)'
    )
    value_options = models.ManyToManyField(
        'marketplaces.MarketplaceAttributeOption',
        blank=True,
        related_name='multi_product_values',
        verbose_name='Значения (множественный выбор)'
    )
    value_string = models.CharField(max_length=1000, blank=True, verbose_name='Значение (строка)')
    value_text = models.TextField(blank=True, verbose_name='Значение (текст)')
    value_int = models.IntegerField(null=True, blank=True, verbose_name='Значение (целое)')
    value_float = models.FloatField(null=True, blank=True, verbose_name='Значение (дробное)')
    value_boolean = models.BooleanField(null=True, blank=True, verbose_name='Значение (да/нет)')
    value_json = models.JSONField(default=dict, blank=True, verbose_name='Значение (JSON)')

    # Мультиязычные значения
    value_string_uk = models.CharField(max_length=1000, blank=True, verbose_name='Значение (строка, укр)')
    value_text_uk = models.TextField(blank=True, verbose_name='Значение (текст, укр)')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Атрибут товара для маркетплейса'
        verbose_name_plural = 'Атрибуты товаров для маркетплейсов'
        unique_together = ['product', 'marketplace_attribute', 'variant', 'variant_size']

    def __str__(self):
        parts = [self.product.name]
        if self.variant:
            parts.append(f'[{self.variant.code}]')
        if self.variant_size:
            parts.append(f'({self.variant_size.size})')
        parts.append(f': {self.marketplace_attribute.name}')
        return ''.join(parts)

    @property
    def marketplace(self):
        return self.marketplace_attribute.attribute_set.marketplace

    def get_value(self):
        """Возвращает значение в зависимости от типа атрибута"""
        attr_type = self.marketplace_attribute.attr_type

        if attr_type == 'select':
            return self.value_option
        elif attr_type == 'multiselect':
            return list(self.value_options.all())
        elif attr_type == 'string':
            return self.value_string
        elif attr_type == 'text':
            return self.value_text
        elif attr_type == 'int':
            return self.value_int
        elif attr_type == 'float':
            return self.value_float
        elif attr_type == 'boolean':
            return self.value_boolean
        elif attr_type == 'array':
            return self.value_json
        return None

    def get_value_for_xml(self, lang='ru'):
        """Возвращает значение в формате для XML"""
        attr_type = self.marketplace_attribute.attr_type
        value = self.get_value()

        if value is None:
            return None

        if attr_type == 'select':
            return {
                'code': value.external_code,
                'name': value.name_uk if lang == 'uk' and value.name_uk else value.name
            }
        elif attr_type == 'multiselect':
            return {
                'codes': ','.join([v.external_code for v in value]),
                'names': ', '.join([v.name_uk if lang == 'uk' and v.name_uk else v.name for v in value])
            }
        elif attr_type == 'string':
            return self.value_string_uk if lang == 'uk' and self.value_string_uk else self.value_string
        elif attr_type == 'text':
            return self.value_text_uk if lang == 'uk' and self.value_text_uk else self.value_text
        else:
            return value
