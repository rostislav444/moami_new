from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import (
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
)
from apps.marketplaces.serializers import (
    MarketplaceAttributeSetSerializer,
    MarketplaceAttributeSerializer,
    MarketplaceAttributeOptionSerializer,
)


class MarketplaceAttributeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для наборов атрибутов (только чтение)

    Endpoints:
    - GET /api/attribute-sets/ - список наборов
    - GET /api/attribute-sets/{id}/ - детали набора
    """

    queryset = MarketplaceAttributeSet.objects.all()
    serializer_class = MarketplaceAttributeSetSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'marketplace', 'marketplace_category'
        ).prefetch_related('attributes')

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        # Фильтр по коду категории
        category_code = self.request.query_params.get('category_code')
        if category_code:
            queryset = queryset.filter(external_code=category_code)

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        """
        Атрибуты набора с опциями

        GET /api/attribute-sets/{id}/attributes/
        """
        attribute_set = self.get_object()
        attributes = attribute_set.attributes.prefetch_related('options')

        # Фильтр только обязательные
        required_only = request.query_params.get('required_only')
        if required_only and required_only.lower() == 'true':
            attributes = attributes.filter(is_required=True)

        serializer = MarketplaceAttributeSerializer(attributes, many=True)
        return Response(serializer.data)


class MarketplaceAttributeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для атрибутов (только чтение)

    Endpoints:
    - GET /api/attributes/ - список атрибутов
    - GET /api/attributes/{id}/ - детали атрибута с опциями
    """

    queryset = MarketplaceAttribute.objects.all()
    serializer_class = MarketplaceAttributeSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'attribute_set', 'attribute_set__marketplace'
        ).prefetch_related('options')

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(
                attribute_set__marketplace_id=marketplace_id
            )

        # Фильтр по набору атрибутов
        attribute_set_id = self.request.query_params.get('attribute_set')
        if attribute_set_id:
            queryset = queryset.filter(attribute_set_id=attribute_set_id)

        # Фильтр по типу
        attr_type = self.request.query_params.get('type')
        if attr_type:
            queryset = queryset.filter(attr_type=attr_type)

        # Только обязательные
        required_only = self.request.query_params.get('required_only')
        if required_only and required_only.lower() == 'true':
            queryset = queryset.filter(is_required=True)

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """
        Опции атрибута

        GET /api/attributes/{id}/options/
        """
        attribute = self.get_object()

        if not attribute.has_options:
            return Response([])

        options = attribute.options.all()

        # Поиск
        search = request.query_params.get('search')
        if search:
            options = options.filter(name__icontains=search)

        serializer = MarketplaceAttributeOptionSerializer(options, many=True)
        return Response(serializer.data)
