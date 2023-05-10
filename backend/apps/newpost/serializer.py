from rest_framework import serializers
from apps.newpost.models import NewPostAreas, NewPostCities, NewPostDepartments


class NewPostAreasSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewPostAreas
        fields = ['ref', 'areas_center', 'description', 'description_ru']


class NewPostCitiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewPostCities
        fields = ['ref', 'description', 'description_ru']


class NewPostDepartmentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewPostDepartments
        fields = ['ref', 'number', 'description', 'description_ru', 'short_address', 'short_address_ru', 'latitude',
                  'longitude', 'schedule']

