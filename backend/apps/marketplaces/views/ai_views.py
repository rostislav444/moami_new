from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings

import logging

logger = logging.getLogger(__name__)


class AIAssistantViewSet(viewsets.ViewSet):
    """
    AI Ассистент для автоматического маппинга товаров

    Endpoints:
    - POST /api/ai/suggest-category/ - предложить категорию для товара
    - POST /api/ai/suggest-attributes/ - предложить атрибуты для товара
    - POST /api/ai/auto-map-product/ - полный автомаппинг товара
    - POST /api/ai/auto-map-bulk/ - массовый автомаппинг товаров
    """

    def _get_agent(self, marketplace_id: int):
        """Получить AI агента для маркетплейса"""
        from apps.marketplaces.models import Marketplace
        from apps.marketplaces.services.ai_mapping_agent import AIMarketplaceMappingAgent

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
            return AIMarketplaceMappingAgent(marketplace)
        except Marketplace.DoesNotExist:
            return None
        except ImportError as e:
            logger.error(f"Failed to import AI agent: {e}")
            return None

    @action(detail=False, methods=['post'])
    def suggest_category(self, request):
        """
        Предложить категорию маркетплейса для товара

        POST /api/ai/suggest-category/
        Body: {
            "marketplace_id": 1,
            "product_id": 123
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')

        if not marketplace_id or not product_id:
            return Response(
                {'error': 'marketplace_id and product_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available. Check ANTHROPIC_API_KEY setting.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.suggest_category(product)
            return Response({
                'success': True,
                'suggestion': result
            })
        except Exception as e:
            logger.error(f"AI suggest_category error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def suggest_attributes(self, request):
        """
        Предложить атрибуты для товара

        POST /api/ai/suggest-attributes/
        Body: {
            "marketplace_id": 1,
            "product_id": 123,
            "category_code": "6390",
            "include_optional": false
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')
        category_code = request.data.get('category_code')
        include_optional = request.data.get('include_optional', False)

        if not all([marketplace_id, product_id, category_code]):
            return Response(
                {'error': 'marketplace_id, product_id, and category_code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.suggest_attributes(product, category_code, include_optional)
            return Response({
                'success': True,
                'attributes': result
            })
        except Exception as e:
            logger.error(f"AI suggest_attributes error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def auto_map_product(self, request):
        """
        Полный автоматический маппинг товара

        POST /api/ai/auto-map-product/
        Body: {
            "marketplace_id": 1,
            "product_id": 123
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_id = request.data.get('product_id')

        if not marketplace_id or not product_id:
            return Response(
                {'error': 'marketplace_id and product_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            result = agent.auto_map_product(product)
            return Response(result)
        except Exception as e:
            logger.error(f"AI auto_map_product error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def auto_map_bulk(self, request):
        """
        Массовый автомаппинг товаров

        POST /api/ai/auto-map-bulk/
        Body: {
            "marketplace_id": 1,
            "product_ids": [1, 2, 3],
            "category_id": 5  // опционально - фильтр по категории
        }
        """
        from apps.product.models import Product

        marketplace_id = request.data.get('marketplace_id')
        product_ids = request.data.get('product_ids', [])
        category_id = request.data.get('category_id')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agent = self._get_agent(marketplace_id)
        if not agent:
            return Response(
                {'error': 'AI agent not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Получить товары
        if product_ids:
            products = Product.objects.filter(id__in=product_ids)
        elif category_id:
            products = Product.objects.filter(category_id=category_id)[:50]  # Лимит
        else:
            products = Product.objects.all()[:20]  # Лимит

        results = []
        for product in products:
            try:
                result = agent.auto_map_product(product)
                results.append(result)
            except Exception as e:
                results.append({
                    'product_id': product.id,
                    'error': str(e)
                })

        return Response({
            'success': True,
            'processed': len(results),
            'results': results
        })

    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Проверить статус AI ассистента

        GET /api/ai/status/
        """
        has_api_key = bool(getattr(settings, 'ANTHROPIC_API_KEY', None))

        try:
            import anthropic
            has_library = True
        except ImportError:
            has_library = False

        return Response({
            'available': has_api_key and has_library,
            'has_api_key': has_api_key,
            'has_library': has_library,
            'message': 'AI assistant is ready' if (has_api_key and has_library) else 'Missing API key or anthropic library'
        })
