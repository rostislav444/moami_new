from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import Marketplace


class SyncViewSet(viewsets.ViewSet):
    """
    ViewSet для операций синхронизации

    Endpoints:
    - POST /api/sync/categories/ - синхронизировать категории
    - POST /api/sync/attributes/ - синхронизировать атрибуты
    - POST /api/sync/options/ - синхронизировать опции
    - POST /api/sync/all/ - синхронизировать всё
    """

    def _get_client(self, marketplace_id):
        """Получить клиент для маркетплейса"""
        from apps.marketplaces.services import get_marketplace_client

        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return None, None

        return marketplace, get_marketplace_client(marketplace)

    @action(detail=False, methods=['post'])
    def categories(self, request):
        """
        Синхронизировать категории

        POST /api/sync/categories/
        Body: {"marketplace_id": 1}
        """
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        marketplace, client = self._get_client(marketplace_id)
        if not client:
            return Response(
                {'error': f'Client for {marketplace.slug if marketplace else "unknown"} not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = client.sync_categories()
        marketplace.update_last_sync()

        return Response({
            'success': True,
            'synced': count
        })

    @action(detail=False, methods=['post'])
    def attributes(self, request):
        """
        Синхронизировать атрибуты

        POST /api/sync/attributes/
        Body: {
            "marketplace_id": 1,
            "category_codes": ["6390"]  // опционально
        }
        """
        marketplace_id = request.data.get('marketplace_id')
        category_codes = request.data.get('category_codes')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        marketplace, client = self._get_client(marketplace_id)
        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = client.sync_attribute_sets(category_codes)

        return Response({
            'success': True,
            'synced': count
        })

    @action(detail=False, methods=['post'])
    def options(self, request):
        """
        Синхронизировать опции атрибутов

        POST /api/sync/options/
        Body: {
            "marketplace_id": 1,
            "attribute_set_code": "6390",
            "attribute_code": "brand"  // опционально, если не указано - все атрибуты
        }
        """
        from apps.marketplaces.models import MarketplaceAttribute

        marketplace_id = request.data.get('marketplace_id')
        attribute_set_code = request.data.get('attribute_set_code')
        attribute_code = request.data.get('attribute_code')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        marketplace, client = self._get_client(marketplace_id)
        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total = 0

        if attribute_code and attribute_set_code:
            # Синхронизировать конкретный атрибут
            total = client.sync_attribute_options(attribute_set_code, attribute_code)
        elif attribute_set_code:
            # Синхронизировать все атрибуты набора
            total = client.sync_all_options_for_set(attribute_set_code)
        else:
            # Синхронизировать все select/multiselect атрибуты
            attrs = MarketplaceAttribute.objects.filter(
                attribute_set__marketplace=marketplace,
                attr_type__in=['select', 'multiselect']
            ).select_related('attribute_set')

            for attr in attrs:
                count = client.sync_attribute_options(
                    attr.attribute_set.external_code,
                    attr.external_code
                )
                total += count

        return Response({
            'success': True,
            'synced': total
        })

    @action(detail=False, methods=['post'])
    def all(self, request):
        """
        Полная синхронизация

        POST /api/sync/all/
        Body: {
            "marketplace_id": 1,
            "category_codes": ["6390"]  // опционально
        }
        """
        from apps.marketplaces.models import MarketplaceAttribute

        marketplace_id = request.data.get('marketplace_id')
        category_codes = request.data.get('category_codes')

        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        marketplace, client = self._get_client(marketplace_id)
        if not client:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = {}

        # 1. Категории
        results['categories'] = client.sync_categories()

        # 2. Атрибуты
        results['attribute_sets'] = client.sync_attribute_sets(category_codes)

        # 3. Опции
        attrs_query = MarketplaceAttribute.objects.filter(
            attribute_set__marketplace=marketplace,
            attr_type__in=['select', 'multiselect']
        ).select_related('attribute_set')

        if category_codes:
            attrs_query = attrs_query.filter(
                attribute_set__external_code__in=category_codes
            )

        total_options = 0
        for attr in attrs_query:
            count = client.sync_attribute_options(
                attr.attribute_set.external_code,
                attr.external_code
            )
            total_options += count

        results['options'] = total_options

        marketplace.update_last_sync()

        return Response({
            'success': True,
            'results': results
        })
