from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from apps.marketplaces.models import (
    MarketplaceEntity,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
)
from apps.marketplaces.serializers.entity_mapping_serializers import (
    MarketplaceEntitySerializer,
    BrandMappingSerializer,
    ColorMappingSerializer,
    CountryMappingSerializer,
    SizeMappingSerializer,
)
from apps.product.models import Brand, Color, Country
from apps.sizes.models import Size


class MarketplaceEntityViewSet(viewsets.ModelViewSet):
    """
    ViewSet для сущностей маркетплейса

    GET /marketplace-entities/?marketplace=X&entity_type=brand
    """

    queryset = MarketplaceEntity.objects.all()
    serializer_class = MarketplaceEntitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(name_uk__icontains=search)
            )

        return queryset


class BrandMappingViewSet(viewsets.ModelViewSet):
    """Маппинг брендов"""

    queryset = BrandMapping.objects.all()
    serializer_class = BrandMappingSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'brand', 'marketplace_entity', 'marketplace_entity__marketplace'
        )

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_entity__marketplace_id=marketplace_id)

        return queryset

    @action(detail=False, methods=['post'])
    def auto_map(self, request):
        """Авто-маппинг брендов по имени"""
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        entities = MarketplaceEntity.objects.filter(
            marketplace_id=marketplace_id, entity_type='brand'
        )
        brands = Brand.objects.all()
        matched = 0

        for brand in brands:
            entity = entities.filter(
                Q(name__iexact=brand.name) | Q(name_uk__iexact=brand.name)
            ).first()

            if entity:
                _, created = BrandMapping.objects.get_or_create(
                    brand=brand, marketplace_entity=entity
                )
                if created:
                    matched += 1

        return Response({'success': True, 'matched': matched})

    @action(detail=False, methods=['get'])
    def our_brands(self, request):
        """Список наших брендов"""
        brands = Brand.objects.all().values('id', 'name')
        return Response(list(brands))


class ColorMappingViewSet(viewsets.ModelViewSet):
    """Маппинг цветов"""

    queryset = ColorMapping.objects.all()
    serializer_class = ColorMappingSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'color', 'marketplace_entity', 'marketplace_entity__marketplace'
        )

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_entity__marketplace_id=marketplace_id)

        return queryset

    @action(detail=False, methods=['post'])
    def auto_map(self, request):
        """Авто-маппинг цветов по имени"""
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        entities = MarketplaceEntity.objects.filter(
            marketplace_id=marketplace_id, entity_type='color'
        )
        colors = Color.objects.all()
        matched = 0

        for color in colors:
            entity = entities.filter(
                Q(name__iexact=color.name) | Q(name_uk__iexact=color.name)
            ).first()

            if entity:
                _, created = ColorMapping.objects.get_or_create(
                    color=color, marketplace_entity=entity
                )
                if created:
                    matched += 1

        return Response({'success': True, 'matched': matched})

    @action(detail=False, methods=['get'])
    def our_colors(self, request):
        """Список наших цветов"""
        colors = Color.objects.all().values('id', 'name', 'code')
        return Response(list(colors))


class CountryMappingViewSet(viewsets.ModelViewSet):
    """Маппинг стран"""

    queryset = CountryMapping.objects.all()
    serializer_class = CountryMappingSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'country', 'marketplace_entity', 'marketplace_entity__marketplace'
        )

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_entity__marketplace_id=marketplace_id)

        return queryset

    @action(detail=False, methods=['post'])
    def auto_map(self, request):
        """Авто-маппинг стран по имени"""
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        entities = MarketplaceEntity.objects.filter(
            marketplace_id=marketplace_id, entity_type='country'
        )
        countries = Country.objects.all()
        matched = 0

        for country in countries:
            entity = entities.filter(
                Q(name__iexact=country.name) | Q(name_uk__iexact=country.name)
            ).first()

            if entity:
                _, created = CountryMapping.objects.get_or_create(
                    country=country, marketplace_entity=entity
                )
                if created:
                    matched += 1

        return Response({'success': True, 'matched': matched})

    @action(detail=False, methods=['get'])
    def our_countries(self, request):
        """Список наших стран"""
        countries = Country.objects.all().values('id', 'name')
        return Response(list(countries))


class SizeMappingViewSet(viewsets.ModelViewSet):
    """Маппинг размеров"""

    queryset = SizeMapping.objects.all()
    serializer_class = SizeMappingSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'size', 'marketplace_entity', 'marketplace_entity__marketplace'
        )

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_entity__marketplace_id=marketplace_id)

        return queryset

    @action(detail=False, methods=['post'])
    def auto_map(self, request):
        """Авто-маппинг размеров по имени"""
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response({'error': 'marketplace_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        entities = MarketplaceEntity.objects.filter(
            marketplace_id=marketplace_id, entity_type='size'
        )
        sizes = Size.objects.all()
        matched = 0

        for size in sizes:
            size_name = str(size)
            entity = entities.filter(
                Q(name__iexact=size_name) | Q(name_uk__iexact=size_name)
            ).first()

            if entity:
                _, created = SizeMapping.objects.get_or_create(
                    size=size, marketplace_entity=entity
                )
                if created:
                    matched += 1

        return Response({'success': True, 'matched': matched})

    @action(detail=False, methods=['get'])
    def our_sizes(self, request):
        """Список наших размеров"""
        sizes = Size.objects.all()
        return Response([{'id': s.id, 'name': str(s)} for s in sizes])
