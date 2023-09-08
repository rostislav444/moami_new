from apps.attributes.models import Attribute
from rest_framework import serializers


class AttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ('name',)
