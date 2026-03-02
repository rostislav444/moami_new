from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count

from apps.marketplaces.models import Marketplace
from apps.marketplaces.serializers import (
    MarketplaceSerializer,
    MarketplaceListSerializer,
)


class MarketplaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления маркетплейсами

    Endpoints:
    - GET /api/marketplaces/ - список маркетплейсов
    - POST /api/marketplaces/ - создать маркетплейс
    - GET /api/marketplaces/{id}/ - детали маркетплейса
    - PATCH /api/marketplaces/{id}/ - обновить маркетплейс
    - DELETE /api/marketplaces/{id}/ - удалить маркетплейс
    - POST /api/marketplaces/{id}/sync/ - синхронизировать данные
    """

    queryset = Marketplace.objects.all()
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.action == 'list':
            return MarketplaceListSerializer
        return MarketplaceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.action == 'list':
            queryset = queryset.annotate(
                categories_count=Count('categories', distinct=True),
                attribute_sets_count=Count('attribute_sets', distinct=True),
            )

        # Фильтр по активности
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """
        Синхронизация данных маркетплейса

        POST /api/marketplaces/{id}/sync/
        Body: {
            "categories": true,
            "attributes": true,
            "options": true,
            "category_codes": ["6390", "5414"]  // опционально
        }
        """
        marketplace = self.get_object()

        from apps.marketplaces.services import get_marketplace_client

        client = get_marketplace_client(marketplace)
        results = {}

        # Синхронизация категорий
        if request.data.get('categories'):
            results['categories'] = client.sync_categories()

        # Синхронизация атрибутов
        if request.data.get('attributes'):
            category_codes = request.data.get('category_codes')
            results['attribute_sets'] = client.sync_attribute_sets(category_codes)

        # Синхронизация опций
        if request.data.get('options'):
            from apps.marketplaces.models import MarketplaceAttribute

            category_codes = request.data.get('category_codes')
            attrs_query = MarketplaceAttribute.objects.filter(
                attribute_set__marketplace=marketplace,
                attr_type__in=['select', 'multiselect']
            )

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

        # Обновить время синхронизации
        marketplace.update_last_sync()

        return Response({
            'success': True,
            'results': results
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Статистика маркетплейса

        GET /api/marketplaces/{id}/stats/
        """
        marketplace = self.get_object()

        from apps.marketplaces.models import (
            MarketplaceCategory,
            CategoryMapping,
            MarketplaceAttributeSet,
            MarketplaceAttributeOption,
        )

        return Response({
            'id': marketplace.id,
            'name': marketplace.name,
            'categories_count': marketplace.categories.count(),
            'categories_with_children': marketplace.categories.filter(has_children=True).count(),
            'leaf_categories': marketplace.categories.filter(has_children=False).count(),
            'mapped_categories': CategoryMapping.objects.filter(
                marketplace_category__marketplace=marketplace
            ).count(),
            'attribute_sets_count': marketplace.attribute_sets.count(),
            'attribute_options_count': MarketplaceAttributeOption.objects.filter(
                attribute__attribute_set__marketplace=marketplace
            ).count(),
            'last_sync': marketplace.last_sync,
            'last_feed_generated': marketplace.last_feed_generated,
        })
