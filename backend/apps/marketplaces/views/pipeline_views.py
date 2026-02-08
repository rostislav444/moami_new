from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import (
    Marketplace,
    MarketplacePipeline,
    PipelineStep,
    PipelineRun,
    BackgroundTask,
)
from apps.marketplaces.serializers import (
    MarketplacePipelineSerializer,
    MarketplacePipelineListSerializer,
    PipelineStepSerializer,
    PipelineStepCreateSerializer,
    PipelineRunSerializer,
    CreatePipelineSerializer,
    ReorderStepsSerializer,
)
from apps.marketplaces.services.task_runner import TaskRunner


class PipelineViewSet(viewsets.ModelViewSet):
    """
    ViewSet для пайплайнов

    Endpoints:
    - GET /api/marketplaces/pipelines/ - список пайплайнов
    - POST /api/marketplaces/pipelines/ - создать пайплайн
    - GET /api/marketplaces/pipelines/{id}/ - получить пайплайн
    - PATCH /api/marketplaces/pipelines/{id}/ - обновить пайплайн
    - DELETE /api/marketplaces/pipelines/{id}/ - удалить пайплайн
    - POST /api/marketplaces/pipelines/{id}/run/ - запустить пайплайн
    - GET /api/marketplaces/pipelines/{id}/runs/ - история запусков
    """

    queryset = MarketplacePipeline.objects.all()
    serializer_class = MarketplacePipelineSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return MarketplacePipelineListSerializer
        if self.action == 'create':
            return CreatePipelineSerializer
        return MarketplacePipelineSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('marketplace')

        # Filter by marketplace if specified
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        return queryset.prefetch_related('steps', 'runs')

    def create(self, request, *args, **kwargs):
        """Создать пайплайн с шагами"""
        serializer = CreatePipelineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        marketplace_id = data['marketplace_id']

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create pipeline
        pipeline = MarketplacePipeline.objects.create(
            marketplace=marketplace,
            name=data['name'],
            description=data.get('description', ''),
            config=data.get('config', {}),
        )

        # Create steps
        for i, step_data in enumerate(data.get('steps', [])):
            PipelineStep.objects.create(
                pipeline=pipeline,
                order=step_data.get('order', i),
                step_type=step_data['step_type'],
                name=step_data['name'],
                description=step_data.get('description', ''),
                config=step_data.get('config', {}),
                is_enabled=step_data.get('is_enabled', True),
                on_error=step_data.get('on_error', 'stop'),
            )

        return Response(
            MarketplacePipelineSerializer(pipeline).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """
        Запустить пайплайн

        POST /api/marketplaces/pipelines/{id}/run/
        Body: {
            "run_in_background": true  // optional, default true
        }
        """
        pipeline = self.get_object()

        if not pipeline.is_active:
            return Response(
                {'error': 'Pipeline is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not pipeline.steps.filter(is_enabled=True).exists():
            return Response(
                {'error': 'Pipeline has no enabled steps'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create run
        pipeline_run = PipelineRun.objects.create(pipeline=pipeline)

        run_in_background = request.data.get('run_in_background', True)

        if run_in_background:
            # Run in background thread
            task = BackgroundTask.create_for_pipeline(pipeline_run)
            TaskRunner.start_task(task)

            return Response({
                'run_id': pipeline_run.id,
                'task_id': task.id,
                'status': 'started',
            }, status=status.HTTP_202_ACCEPTED)
        else:
            # Run synchronously (for testing)
            from apps.marketplaces.services.pipeline_executor import PipelineExecutor
            executor = PipelineExecutor(pipeline_run)
            success = executor.execute()

            return Response({
                'run_id': pipeline_run.id,
                'status': pipeline_run.status,
                'success': success,
                'progress': pipeline_run.progress,
            })

    @action(detail=True, methods=['get'])
    def runs(self, request, pk=None):
        """
        История запусков пайплайна

        GET /api/marketplaces/pipelines/{id}/runs/
        """
        pipeline = self.get_object()
        runs = pipeline.runs.all()[:50]

        return Response({
            'pipeline_id': pipeline.id,
            'runs': PipelineRunSerializer(runs, many=True).data,
        })


class PipelineStepViewSet(viewsets.ModelViewSet):
    """
    ViewSet для шагов пайплайна

    Endpoints:
    - GET /api/marketplaces/pipeline-steps/ - список шагов
    - POST /api/marketplaces/pipeline-steps/ - создать шаг
    - PATCH /api/marketplaces/pipeline-steps/{id}/ - обновить шаг
    - DELETE /api/marketplaces/pipeline-steps/{id}/ - удалить шаг
    - POST /api/marketplaces/pipeline-steps/reorder/ - переупорядочить шаги
    """

    queryset = PipelineStep.objects.all()
    serializer_class = PipelineStepSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('pipeline')

        # Filter by pipeline if specified
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        return queryset.order_by('order')

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Переупорядочить шаги

        POST /api/marketplaces/pipeline-steps/reorder/
        Body: {
            "step_ids": [3, 1, 2, 4]
        }
        """
        serializer = ReorderStepsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        step_ids = serializer.validated_data['step_ids']

        for order, step_id in enumerate(step_ids):
            PipelineStep.objects.filter(id=step_id).update(order=order)

        return Response({'success': True, 'order': step_ids})


class PipelineRunViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для запусков пайплайнов (только чтение)

    Endpoints:
    - GET /api/marketplaces/pipeline-runs/ - список запусков
    - GET /api/marketplaces/pipeline-runs/{id}/ - статус запуска
    - POST /api/marketplaces/pipeline-runs/{id}/cancel/ - отменить запуск
    """

    queryset = PipelineRun.objects.all()
    serializer_class = PipelineRunSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('pipeline', 'current_step')

        # Filter by pipeline if specified
        pipeline_id = self.request.query_params.get('pipeline')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        # Filter by status if specified
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Отменить запуск пайплайна

        POST /api/marketplaces/pipeline-runs/{id}/cancel/
        """
        pipeline_run = self.get_object()

        if pipeline_run.status not in ('pending', 'running'):
            return Response(
                {'error': f'Cannot cancel run with status: {pipeline_run.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pipeline_run.status = 'cancelled'
        pipeline_run.save()

        return Response({
            'success': True,
            'status': pipeline_run.status,
        })
