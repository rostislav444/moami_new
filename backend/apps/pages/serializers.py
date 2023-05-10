from rest_framework import serializers
from apps.pages.models import HomeSlider


class HomeSliderSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeSlider
        fields = '__all__'
