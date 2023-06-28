from rest_framework import serializers
from apps.pages.models import HomeSlider, Pages


class HomeSliderSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeSlider
        fields = '__all__'


class PagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pages
        fields = '__all__'


class PagesSerializerLight(serializers.ModelSerializer):
    class Meta:
        model = Pages
        fields = ['name', 'slug']
