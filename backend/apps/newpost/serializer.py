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


# Uses for nested serializers
class NewPostCitiesRel(NewPostCitiesSerializer):
    departments = NewPostDepartmentsSerializer(many=True, read_only=True)

    class Meta(NewPostCitiesSerializer.Meta):
        fields = NewPostCitiesSerializer.Meta.fields + ['departments']


class NewPostAreasRel(NewPostAreasSerializer):
    cities = NewPostCitiesRel(many=True, read_only=True)

    class Meta(NewPostAreasSerializer.Meta):
        fields = NewPostAreasSerializer.Meta.fields + ['cities']