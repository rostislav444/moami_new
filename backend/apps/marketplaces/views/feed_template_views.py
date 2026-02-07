from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.template import Template, Context

from apps.marketplaces.models import FeedTemplate, Marketplace
from apps.marketplaces.serializers.feed_template_serializers import (
    FeedTemplateSerializer,
    FeedPreviewSerializer,
)


class FeedTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet для шаблонов фидов

    Endpoints:
    - GET /api/feed-templates/ - список шаблонов
    - POST /api/feed-templates/ - создать шаблон
    - PATCH /api/feed-templates/{id}/ - обновить шаблон
    - DELETE /api/feed-templates/{id}/ - удалить шаблон
    - POST /api/feed-templates/preview/ - предпросмотр фида
    """

    queryset = FeedTemplate.objects.all()
    serializer_class = FeedTemplateSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('marketplace')

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        return queryset

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Предпросмотр сгенерированного фида

        POST /api/feed-templates/preview/
        Body: {
            "marketplace_id": 1,
            "product_id": 123  // опционально
        }
        """
        serializer = FeedPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        marketplace_id = serializer.validated_data['marketplace_id']
        product_id = serializer.validated_data.get('product_id')

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Получить шаблоны
        templates = {
            t.template_type: t.content
            for t in FeedTemplate.objects.filter(marketplace=marketplace, is_active=True)
        }

        # Сгенерировать превью
        xml_parts = []

        # Header
        if 'header' in templates:
            context = {
                'shop_name': 'MOAMI',
                'company_name': 'MOAMI Store',
                'shop_url': 'https://moami.com.ua',
            }
            xml_parts.append(self._render_template(templates['header'], context))

        # Product (sample)
        if 'product' in templates:
            sample_product = self._get_sample_product(product_id)
            if sample_product:
                xml_parts.append(self._render_template(templates['product'], {'product': sample_product}))

        # Footer
        if 'footer' in templates:
            xml_parts.append(self._render_template(templates['footer'], {}))

        return Response({
            'xml': '\n'.join(xml_parts) if xml_parts else '<!-- Нет настроенных шаблонов -->'
        })

    def _render_template(self, template_content: str, context: dict) -> str:
        """Рендер шаблона с контекстом"""
        try:
            # Заменяем Jinja2 синтаксис на Django
            content = template_content.replace('{{', '{{ ').replace('}}', ' }}')
            content = content.replace('{%', '{% ').replace('%}', ' %}')

            template = Template(content)
            return template.render(Context(context))
        except Exception as e:
            return f'<!-- Ошибка рендеринга: {str(e)} -->'

    def _get_sample_product(self, product_id=None):
        """Получить пример товара для превью"""
        from apps.product.models import Product

        if product_id:
            product = Product.objects.filter(id=product_id).first()
        else:
            product = Product.objects.first()

        if not product:
            return {
                'id': 1,
                'name': 'Пример товара',
                'price': 1999,
                'url': 'https://moami.com.ua/product/example/',
                'image': 'https://moami.com.ua/media/example.jpg',
                'category_code': '6390',
                'description': 'Описание товара',
                'available': 'true',
                'attributes': [
                    {'name': 'Цвет', 'value': 'Красный'},
                    {'name': 'Размер', 'value': 'M'},
                ],
            }

        return {
            'id': product.id,
            'name': product.name,
            'price': product.get_price() if hasattr(product, 'get_price') else 0,
            'url': f'https://moami.com.ua/product/{product.slug}/',
            'image': product.get_main_image() if hasattr(product, 'get_main_image') else '',
            'category_code': '6390',
            'description': product.description if hasattr(product, 'description') else '',
            'available': 'true',
            'attributes': [],
        }
