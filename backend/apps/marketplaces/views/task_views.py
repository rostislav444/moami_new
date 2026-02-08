from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import BackgroundTask
from apps.marketplaces.serializers import (
    BackgroundTaskSerializer,
    BackgroundTaskListSerializer,
)
from apps.marketplaces.services.task_runner import TaskRunner


class BackgroundTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для фоновых задач (только чтение + отмена)

    Endpoints:
    - GET /api/tasks/ - список задач
    - GET /api/tasks/{id}/ - статус задачи
    - POST /api/tasks/{id}/cancel/ - отменить задачу
    """

    queryset = BackgroundTask.objects.all()
    serializer_class = BackgroundTaskSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return BackgroundTaskListSerializer
        return BackgroundTaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by task_type if specified
        task_type = self.request.query_params.get('type')
        if task_type:
            queryset = queryset.filter(task_type=task_type)

        # Filter by status if specified
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Limit to recent tasks by default
        limit = int(self.request.query_params.get('limit', 50))
        return queryset[:limit]

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Отменить задачу

        POST /api/tasks/{id}/cancel/
        """
        task = self.get_object()

        success = TaskRunner.cancel_task(task.id)

        if success:
            task.refresh_from_db()
            return Response({
                'success': True,
                'status': task.status,
            })
        else:
            return Response(
                {'error': f'Cannot cancel task with status: {task.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Получить список активных задач

        GET /api/tasks/active/
        """
        active_ids = TaskRunner.get_active_tasks()
        tasks = BackgroundTask.objects.filter(id__in=active_ids)

        return Response({
            'count': len(active_ids),
            'tasks': BackgroundTaskListSerializer(tasks, many=True).data,
        })

    @action(detail=True, methods=['get'])
    def poll(self, request, pk=None):
        """
        Polling для статуса задачи

        GET /api/tasks/{id}/poll/
        """
        task = self.get_object()

        return Response({
            'id': task.id,
            'status': task.status,
            'progress': task.progress,
            'progress_message': task.progress_message,
            'result': task.result if task.status == 'completed' else None,
            'error': task.error if task.status == 'failed' else None,
        })
