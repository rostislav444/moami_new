from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from apps.marketplaces.models import FeedTemplate, Marketplace
from apps.marketplaces.serializers.feed_template_serializers import (
    FeedTemplateSerializer,
    FeedPreviewSerializer,
)


class FeedTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet для шаблонов фидов

    Endpoints:
    - GET /feed-templates/?marketplace=X — список шаблонов
    - POST /feed-templates/ — создать шаблон
    - PATCH /feed-templates/{id}/ — обновить
    - DELETE /feed-templates/{id}/ — удалить
    - POST /feed-templates/preview/ — предпросмотр (1 товар)
    - POST /feed-templates/generate/ — сгенерировать полный фид
    - GET /feed-templates/download/?marketplace_id=X — скачать XML
    - GET /feed-templates/variables/ — справочник переменных
    """

    queryset = FeedTemplate.objects.all()
    serializer_class = FeedTemplateSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('marketplace')
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)
        return queryset

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Предпросмотр фида для одного товара.
        POST /feed-templates/preview/
        Body: {"marketplace_id": 1, "product_id": 123}
        """
        serializer = FeedPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        marketplace_id = serializer.validated_data['marketplace_id']
        product_id = serializer.validated_data.get('product_id')

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response({'error': 'Marketplace not found'}, status=status.HTTP_404_NOT_FOUND)

        from apps.marketplaces.services.feed_generator import FeedGenerator
        generator = FeedGenerator(marketplace)
        result = generator.generate(product_id=product_id)

        return Response(result)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Сгенерировать полный фид.
        POST /feed-templates/generate/
        Body: {"marketplace_id": 1}
        """
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response({'error': 'Marketplace not found'}, status=status.HTTP_404_NOT_FOUND)

        from apps.marketplaces.services.feed_generator import FeedGenerator
        generator = FeedGenerator(marketplace)
        result = generator.generate()

        # Save to file
        import os
        feed_dir = os.path.join(settings.MEDIA_ROOT, 'mp_feed')
        os.makedirs(feed_dir, exist_ok=True)
        filename = marketplace.feed_filename or f'{marketplace.slug}.xml'
        filepath = os.path.join(feed_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(result['xml'])

        from django.utils import timezone
        from django.conf import settings
        marketplace.last_feed_generated = timezone.now()
        marketplace.save(update_fields=['last_feed_generated'])

        result['file_path'] = f'/media/mp_feed/{filename}'
        return Response(result)

    @action(detail=False, methods=['get'])
    def download(self, request):
        """
        Скачать сгенерированный фид.
        GET /feed-templates/download/?marketplace_id=X
        """
        marketplace_id = request.query_params.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response({'error': 'Marketplace not found'}, status=status.HTTP_404_NOT_FOUND)

        from apps.marketplaces.services.feed_generator import FeedGenerator
        generator = FeedGenerator(marketplace)
        result = generator.generate()

        filename = marketplace.feed_filename or f'{marketplace.slug}.xml'
        response = HttpResponse(result['xml'], content_type='application/xml; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def variables(self, request):
        """Справочник доступных переменных шаблона"""
        from apps.marketplaces.services.feed_generator import TEMPLATE_VARIABLES
        return Response(TEMPLATE_VARIABLES)
