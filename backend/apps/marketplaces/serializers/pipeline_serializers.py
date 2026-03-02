from rest_framework import serializers
from apps.marketplaces.models import MarketplacePipeline, PipelineStep, PipelineRun


class PipelineStepSerializer(serializers.ModelSerializer):
    """Serializer for pipeline steps"""

    class Meta:
        model = PipelineStep
        fields = [
            'id',
            'pipeline',
            'order',
            'step_type',
            'name',
            'description',
            'config',
            'is_enabled',
            'on_error',
            'retry_count',
            'timeout',
        ]
        read_only_fields = ['id']


class PipelineStepCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating pipeline steps"""

    class Meta:
        model = PipelineStep
        fields = [
            'order',
            'step_type',
            'name',
            'description',
            'config',
            'is_enabled',
            'on_error',
            'retry_count',
            'timeout',
        ]


class MarketplacePipelineSerializer(serializers.ModelSerializer):
    """Serializer for marketplace pipelines"""

    steps = PipelineStepSerializer(many=True, read_only=True)
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)
    steps_count = serializers.SerializerMethodField()
    last_run = serializers.SerializerMethodField()

    class Meta:
        model = MarketplacePipeline
        fields = [
            'id',
            'marketplace',
            'marketplace_name',
            'name',
            'description',
            'purpose',
            'is_active',
            'config',
            'steps',
            'steps_count',
            'last_run',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_steps_count(self, obj):
        return obj.steps.count()

    def get_last_run(self, obj):
        last = obj.runs.first()
        if last:
            return {
                'id': last.id,
                'status': last.status,
                'started_at': last.started_at,
                'finished_at': last.finished_at,
            }
        return None


class MarketplacePipelineListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing pipelines"""

    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)
    steps_count = serializers.SerializerMethodField()
    runs_count = serializers.SerializerMethodField()
    last_run_status = serializers.SerializerMethodField()

    class Meta:
        model = MarketplacePipeline
        fields = [
            'id',
            'marketplace',
            'marketplace_name',
            'name',
            'description',
            'purpose',
            'is_active',
            'steps_count',
            'runs_count',
            'last_run_status',
            'created_at',
            'updated_at',
        ]

    def get_steps_count(self, obj):
        return obj.steps.filter(is_enabled=True).count()

    def get_runs_count(self, obj):
        return obj.runs.count()

    def get_last_run_status(self, obj):
        last = obj.runs.first()
        return last.status if last else None


class PipelineRunSerializer(serializers.ModelSerializer):
    """Serializer for pipeline runs"""

    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    current_step_name = serializers.CharField(source='current_step.name', read_only=True, allow_null=True)
    duration = serializers.FloatField(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)
    completed_steps_count = serializers.IntegerField(read_only=True)
    total_steps_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PipelineRun
        fields = [
            'id',
            'pipeline',
            'pipeline_name',
            'status',
            'started_at',
            'finished_at',
            'current_step',
            'current_step_name',
            'progress',
            'progress_percent',
            'completed_steps_count',
            'total_steps_count',
            'duration',
            'error_message',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CreatePipelineSerializer(serializers.Serializer):
    """Serializer for creating a pipeline"""

    marketplace_id = serializers.IntegerField()
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    purpose = serializers.ChoiceField(
        choices=MarketplacePipeline.PURPOSE_CHOICES,
        required=False,
        default='other'
    )
    config = serializers.JSONField(required=False, default=dict)
    steps = PipelineStepCreateSerializer(many=True, required=False, default=list)


class ReorderStepsSerializer(serializers.Serializer):
    """Serializer for reordering steps"""

    step_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='List of step IDs in new order'
    )
