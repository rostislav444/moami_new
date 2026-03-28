from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from apps.marketplaces.models import (
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
)
from apps.marketplaces.serializers import (
    MarketplaceAttributeSetSerializer,
    MarketplaceAttributeSetListSerializer,
    MarketplaceAttributeSerializer,
    MarketplaceAttributeOptionSerializer,
)


class AttributeSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class MarketplaceAttributeSetViewSet(viewsets.ModelViewSet):
    """
    ViewSet для наборов атрибутов
    """

    queryset = MarketplaceAttributeSet.objects.all()
    serializer_class = MarketplaceAttributeSetListSerializer
    pagination_class = AttributeSetPagination

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'marketplace',
        ).annotate(
            attributes_count=Count('attributes'),
        )

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        category_code = self.request.query_params.get('category_code')
        if category_code:
            queryset = queryset.filter(external_code=category_code)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MarketplaceAttributeSetSerializer
        return MarketplaceAttributeSetListSerializer

    @action(detail=False, methods=['delete'], url_path='delete-all')
    def delete_all(self, request):
        """Delete all attribute sets for a marketplace"""
        marketplace_id = request.query_params.get('marketplace')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = MarketplaceAttributeSet.objects.filter(marketplace_id=marketplace_id)
        count = qs.count()
        qs.delete()
        return Response({'deleted': count})

    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        """
        Атрибуты набора с опциями

        GET /api/attribute-sets/{id}/attributes/
        """
        attribute_set = self.get_object()
        attributes = attribute_set.attributes.prefetch_related('options')

        required_only = request.query_params.get('required_only')
        if required_only and required_only.lower() == 'true':
            attributes = attributes.filter(is_required=True)

        serializer = MarketplaceAttributeSerializer(attributes, many=True)
        return Response(serializer.data)


class MarketplaceAttributeViewSet(viewsets.ModelViewSet):
    """
    ViewSet для атрибутов
    """

    queryset = MarketplaceAttribute.objects.all()
    serializer_class = MarketplaceAttributeSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'attribute_set', 'attribute_set__marketplace'
        ).prefetch_related('options')

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(
                attribute_set__marketplace_id=marketplace_id
            )

        attribute_set_id = self.request.query_params.get('attribute_set')
        if attribute_set_id:
            queryset = queryset.filter(attribute_set_id=attribute_set_id)

        attr_type = self.request.query_params.get('type')
        if attr_type:
            queryset = queryset.filter(attr_type=attr_type)

        required_only = self.request.query_params.get('required_only')
        if required_only and required_only.lower() == 'true':
            queryset = queryset.filter(is_required=True)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """Опции атрибута"""
        attribute = self.get_object()

        if not attribute.has_options:
            return Response([])

        options = attribute.options.all()

        search = request.query_params.get('search')
        if search:
            options = options.filter(name__icontains=search)

        serializer = MarketplaceAttributeOptionSerializer(options, many=True)
        return Response(serializer.data)
