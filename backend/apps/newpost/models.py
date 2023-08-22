import json

from django.db import models
from django.core.exceptions import ValidationError
import requests


class NewPostApiKey(models.Model):
    value = models.CharField(max_length=255, verbose_name='Ключ')

    class Meta:
        verbose_name = 'Ключ Новой почты'
        verbose_name_plural = '1. Ключ Новой почты'

    @staticmethod
    def test_data(key):
        return {
            "apiKey": key,
            "modelName": "Address",
            "calledMethod": "searchSettlements",
            "methodProperties": {
                "CityName": "київ",
                "Limit": "1",
                "Page": "1"
            }
        }

    def clean(self):
        endpoint = 'https://api.novaposhta.ua/v2.0/json/'
        data = json.dumps(self.test_data(self.value))
        response = requests.post(endpoint, data)
        response = response.json()
        if not response['success']:
            raise ValidationError('Ключ не валидный')

    def __str__(self):
        return 'Ключ Новой почты'


class NewPostAreas(models.Model):
    ref = models.UUIDField(max_length=255, primary_key=True)
    areas_center = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    description_ru = models.CharField(max_length=255)

    class Meta:
        ordering = ('description', 'description_ru',)
        verbose_name = 'Область'
        verbose_name_plural = '2. Области'

    def __str__(self):
        return f'{self.description} ({self.description_ru}) область'


class NewPostRegion(models.Model):
    area = models.ForeignKey(NewPostAreas, on_delete=models.CASCADE)
    region = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    description_ru = models.CharField(max_length=255)
    description_translit = models.CharField(max_length=255)

    class Meta:
        ordering = ('description', 'description_ru',)
        verbose_name = 'Район'
        verbose_name_plural = '3. Районы'

    def __str__(self):
        return f'{self.description}, {self.area.description} район'


class NewPostCities(models.Model):
    ref = models.UUIDField(max_length=255, primary_key=True)
    area = models.ForeignKey(NewPostAreas, on_delete=models.CASCADE, null=True, blank=True)
    region = models.ForeignKey(NewPostRegion, on_delete=models.CASCADE, null=True, blank=True)
    settlement_type = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=18, decimal_places=16)
    longitude = models.DecimalField(max_digits=18, decimal_places=16)
    description = models.CharField(max_length=255)
    description_ru = models.CharField(max_length=255)
    description_translit = models.CharField(max_length=255)
    settlement_type_description = models.CharField(max_length=255)
    settlement_type_description_ru = models.CharField(max_length=255)
    settlement_type_description_translit = models.CharField(max_length=255)
    warehouse = models.BooleanField(default=False)

    class Meta:
        ordering = ('description', 'description_ru',)
        verbose_name = 'Город'
        verbose_name_plural = '4. Города'

    def __str__(self):
        if self.region:
            return f'{self.description}, {self.region.description}'
        return self.description


class NewPostDepartments(models.Model):
    ref = models.UUIDField(max_length=255, primary_key=True)
    city = models.ForeignKey(NewPostCities, on_delete=models.CASCADE, related_name='departments')
    number = models.PositiveIntegerField(default=0)
    site_key = models.PositiveIntegerField()
    description = models.CharField(max_length=255)
    description_ru = models.CharField(max_length=255)
    short_address = models.CharField(max_length=255)
    short_address_ru = models.CharField(max_length=255)
    phone = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=18, decimal_places=16)
    longitude = models.DecimalField(max_digits=18, decimal_places=16)
    schedule = models.JSONField(default=dict)
    receiving_limitations_on_dimensions = models.JSONField(default=dict)
    place_max_weight_allowed = models.PositiveIntegerField(default=0)
    warehouse_status = models.CharField(max_length=255)
    warehouse_index = models.CharField(max_length=255)

    class Meta:
        ordering = ('number', 'description', 'description_ru',)
        verbose_name = 'Отделение'
        verbose_name_plural = '5. Отделения'

    def __str__(self):
        return f'{str(self.site_key)}, {self.description}'
