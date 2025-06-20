from django.db import models
from apps.product.models import VariantSize
from apps.user.models import User
from apps.newpost.models import NewPostRegion, NewPostCities, NewPostDepartments, NewPostAreas


class Order(models.Model):
    ORDER_STATUSES = (
        ('new', 'Новый заказ'),
        ('in_progress', 'Заказ в обработке'),
        ('ready', 'Заказ готов'),
        ('completed', 'Заказ выполнен'),
        ('canceled', 'Заказ отменен'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Пользователь', related_name='orders',
                             blank=True, null=True)
    first_name = models.CharField(max_length=100, verbose_name='Имя')
    last_name = models.CharField(max_length=100, verbose_name='Фамилия')
    father_name = models.CharField(max_length=100, verbose_name='Отчество', blank=True, null=True)
    phone = models.CharField(max_length=20, verbose_name='Телефон')
    email = models.EmailField(max_length=100, verbose_name='Email', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    status = models.CharField(max_length=100, choices=ORDER_STATUSES, verbose_name='Статус', default='new')
    comment = models.TextField(verbose_name='Комментарий', blank=True)

    def __str__(self):
        return f'Заказ №{self.id}'

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def total_price(self):
        return sum([item.total_price() for item in self.items.all()])

    total_price.short_description = 'Сумма'

    def total_quantity(self):
        return sum([item.quantity for item in self.items.all()])

    total_quantity.short_description = 'Кол-во'

    def completed_order(self):
        if self.status == 'completed':
            for item in self.items.all():
                item.size.quantity -= item.quantity
                item.size.save()

    def set_names(self):
        if not self.first_name and self.user.first_name:
            self.first_name = self.user.first_name

        if not self.last_name and self.user.last_name:
            self.last_name = self.user.last_name

        if not self.father_name and self.user.father_name:
            self.father_name = self.user.father_name

    def save(self, *args, **kwargs):
        self.completed_order()
        self.set_names()
        super().save(*args, **kwargs)


class OrderItemManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('size__variant__product')


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, verbose_name='Заказ', related_name='items')
    size = models.ForeignKey(VariantSize, on_delete=models.CASCADE, verbose_name='Размер')
    quantity = models.PositiveIntegerField(verbose_name='Количество')
    price = models.IntegerField(verbose_name='Цена', default=0, blank=True)

    objects = OrderItemManager()

    @property
    def get_price(self):
        return self.size.variant.product.price

    @property
    def get_item_image(self):
        return self.size.variant.get_first_image_url

    def total_price(self):
        if self.price:
            return self.price * self.quantity
        return 0

    def save(self, *args, **kwargs):
        if not self.price:
            self.price = self.get_price
        super().save(*args, **kwargs)

    def __str__(self):
        size_name = self.size.get_size
        return f'Товар {self.size.variant.product.name} - {size_name} в  заказе №{self.order.id}'

    total_price.short_description = 'Сумма'


class OrderDelivery(models.Model):
    DELIVERY_TYPES = (
        ('address', 'Курьером по Киеву'),
        ('newpost', 'Новая почта'),
        ('other', 'Другое'),
    )

    delivery_type = models.CharField(max_length=100, choices=DELIVERY_TYPES, verbose_name='Тип доставки')
    order = models.OneToOneField(Order, on_delete=models.CASCADE, verbose_name='Заказ', related_name='delivery')
    comment = models.TextField(verbose_name='Комментарий', blank=True, null=True)

    class Meta:
        verbose_name = 'Доставка'
        verbose_name_plural = 'Доставки'
        ordering = ['-order__created_at']


class OrderDeliveryAddress(models.Model):
    delivery = models.OneToOneField(OrderDelivery, on_delete=models.CASCADE, verbose_name='Доставка',
                                    related_name='address')
    city = models.CharField(max_length=100, verbose_name='Город', default='Киев')
    address = models.CharField(max_length=100, verbose_name='Адрес')

    def __str__(self):
        return f'Адрес доставки заказа №{self.delivery.order.id}'

    class Meta:
        verbose_name = 'Адрес доставки'
        verbose_name_plural = 'Адреса доставки'
        ordering = ['-delivery__order__created_at']


class OrderDeliveryNewPost(models.Model):
    delivery = models.OneToOneField(OrderDelivery, on_delete=models.CASCADE, verbose_name='Доставка',
                                    related_name='newpost')
    area = models.ForeignKey(NewPostAreas, on_delete=models.CASCADE, verbose_name='Область', blank=True, null=True)
    region = models.ForeignKey(NewPostRegion, on_delete=models.CASCADE, verbose_name='Регион', blank=True, null=True)
    city = models.ForeignKey(NewPostCities, on_delete=models.CASCADE, verbose_name='Город', blank=True, null=True)
    department = models.ForeignKey(NewPostDepartments, on_delete=models.CASCADE, verbose_name='Отделение', blank=True, null=True)
    
    city_text = models.CharField(max_length=255, verbose_name='Город (текст)', blank=True, null=True)
    warehouse_text = models.CharField(max_length=255, verbose_name='Склад (текст)', blank=True, null=True)

    def __str__(self):
        return f'Адрес доставки заказа №{self.delivery.order.id}'

    class Meta:
        verbose_name = 'Доставка новой почтой'
        verbose_name_plural = 'Доставки новой почтой'
        ordering = ['-delivery__order__created_at']
