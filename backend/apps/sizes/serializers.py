from rest_framework import serializers
from apps.sizes.models import SizeGrid, SizeGroup


class SizeGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeGrid
        fields = ('id', 'name', 'slug', 'order', 'is_default')


class SizeGroupSerializer(serializers.ModelSerializer):
    grids = SizeGridSerializer(many=True)

    class Meta:
        model = SizeGroup
        fields = ('grids',)
