from django.db import models


class MarketplaceEntity(models.Model):
    """Сущность маркетплейса (бренд, страна, цвет, размер)"""

    ENTITY_TYPE_CHOICES = [
        ('brand', 'Бренд'),
        ('country', 'Страна'),
        ('color', 'Цвет'),
        ('size', 'Размер'),
        ('measure', 'Единица измерения'),
    ]

    marketplace = models.ForeignKey(
        'marketplaces.Marketplace',
        on_delete=models.CASCADE,
        related_name='entities',
        verbose_name='Маркетплейс'
    )
    entity_type = models.CharField(
        max_length=20,
        choices=ENTITY_TYPE_CHOICES,
        verbose_name='Тип сущности'
    )

    external_id = models.CharField(max_length=100, verbose_name='Внешний ID')
    external_code = models.CharField(max_length=100, blank=True, verbose_name='Код')
    name = models.CharField(max_length=255, verbose_name='Название')
    name_uk = models.CharField(max_length=255, blank=True, verbose_name='Название (укр)')

    class Meta:
        verbose_name = 'Сущность маркетплейса'
        verbose_name_plural = 'Сущности маркетплейсов'
        unique_together = ['marketplace', 'entity_type', 'external_id']
        ordering = ['entity_type', 'name']

    def __str__(self):
        return f'{self.get_entity_type_display()}: {self.name}'


class BrandMapping(models.Model):
    """Маппинг бренда на сущность маркетплейса"""

    brand = models.ForeignKey(
        'product.Brand',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наш бренд'
    )
    marketplace_entity = models.ForeignKey(
        MarketplaceEntity,
        on_delete=models.CASCADE,
        limit_choices_to={'entity_type': 'brand'},
        related_name='brand_mappings',
        verbose_name='Бренд маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Маппинг бренда'
        verbose_name_plural = 'Маппинги брендов'
        unique_together = ['brand', 'marketplace_entity']

    def __str__(self):
        return f'{self.brand.name} → {self.marketplace_entity.name}'

    @property
    def marketplace(self):
        return self.marketplace_entity.marketplace


class ColorMapping(models.Model):
    """Маппинг цвета на сущность маркетплейса"""

    color = models.ForeignKey(
        'product.Color',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наш цвет'
    )
    marketplace_entity = models.ForeignKey(
        MarketplaceEntity,
        on_delete=models.CASCADE,
        limit_choices_to={'entity_type': 'color'},
        related_name='color_mappings',
        verbose_name='Цвет маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Маппинг цвета'
        verbose_name_plural = 'Маппинги цветов'
        unique_together = ['color', 'marketplace_entity']

    def __str__(self):
        return f'{self.color.name} → {self.marketplace_entity.name}'


class CountryMapping(models.Model):
    """Маппинг страны на сущность маркетплейса"""

    country = models.ForeignKey(
        'product.Country',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наша страна'
    )
    marketplace_entity = models.ForeignKey(
        MarketplaceEntity,
        on_delete=models.CASCADE,
        limit_choices_to={'entity_type': 'country'},
        related_name='country_mappings',
        verbose_name='Страна маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Маппинг страны'
        verbose_name_plural = 'Маппинги стран'
        unique_together = ['country', 'marketplace_entity']

    def __str__(self):
        return f'{self.country.name} → {self.marketplace_entity.name}'


class SizeMapping(models.Model):
    """Маппинг размера на сущность маркетплейса"""

    size = models.ForeignKey(
        'sizes.Size',
        on_delete=models.CASCADE,
        related_name='marketplace_mappings',
        verbose_name='Наш размер'
    )
    marketplace_entity = models.ForeignKey(
        MarketplaceEntity,
        on_delete=models.CASCADE,
        limit_choices_to={'entity_type': 'size'},
        related_name='size_mappings',
        verbose_name='Размер маркетплейса'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Маппинг размера'
        verbose_name_plural = 'Маппинги размеров'
        unique_together = ['size', 'marketplace_entity']

    def __str__(self):
        return f'{self.size} → {self.marketplace_entity.name}'
