from rest_framework import serializers
from apps.marketplaces.models import BackgroundTask


class BackgroundTaskSerializer(serializers.ModelSerializer):
    """Serializer for background tasks"""

    duration = serializers.FloatField(read_only=True)
    content_type_name = serializers.SerializerMethodField()

    class Meta:
        model = BackgroundTask
        fields = [
            'id',
            'task_type',
            'name',
            'status',
            'payload',
            'result',
            'error',
            'progress',
            'progress_message',
            'duration',
            'started_at',
            'finished_at',
            'created_at',
            'content_type',
            'content_type_name',
            'object_id',
        ]
        read_only_fields = ['id', 'created_at']

    def get_content_type_name(self, obj):
        if obj.content_type:
            return obj.content_type.model
        return None


class BackgroundTaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing tasks"""

    duration = serializers.FloatField(read_only=True)

    class Meta:
        model = BackgroundTask
        fields = [
            'id',
            'task_type',
            'name',
            'status',
            'progress',
            'progress_message',
            'duration',
            'started_at',
            'finished_at',
            'created_at',
        ]
