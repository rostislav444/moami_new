from rest_framework import serializers
from apps.sizes.models import SizeGrid


class SizeGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeGrid
        fields = ('id', 'name', 'slug', 'order', 'is_default')



