from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import (
    ProductMarketplaceConfig,
    ProductMarketplaceAttribute,
)
from apps.marketplaces.serializers import (
    ProductMarketplaceConfigSerializer,
    ProductMarketplaceAttributeSerializer,
    ProductExportStatusSerializer,
)
from apps.marketplaces.serializers.product_serializers import (
    BulkProductAttributeSerializer,
)
from apps.product.models import Product


class ProductMarketplaceConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet для настроек товара для маркетплейса

    Endpoints:
    - GET /api/product-configs/ - список настроек
    - POST /api/product-configs/ - создать настройку
    - PATCH /api/product-configs/{id}/ - обновить настройку
    """

    queryset = ProductMarketplaceConfig.objects.all()
    serializer_class = ProductMarketplaceConfigSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('product', 'marketplace')

        # Фильтр по товару
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        return queryset


class ProductMarketplaceAttributeViewSet(viewsets.ModelViewSet):
    """
    ViewSet для атрибутов товара для маркетплейса

    Endpoints:
    - GET /api/product-attributes/ - список атрибутов
    - POST /api/product-attributes/ - создать/обновить атрибут
    - POST /api/product-attributes/bulk/ - массовое создание
    """

    queryset = ProductMarketplaceAttribute.objects.all()
    serializer_class = ProductMarketplaceAttributeSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'product', 'marketplace_attribute', 'marketplace_attribute__attribute_set'
        )

        # Фильтр по товару
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(
                marketplace_attribute__attribute_set__marketplace_id=marketplace_id
            )

        # Фильтр по набору атрибутов
        attribute_set_id = self.request.query_params.get('attribute_set')
        if attribute_set_id:
            queryset = queryset.filter(
                marketplace_attribute__attribute_set_id=attribute_set_id
            )

        return queryset

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Массовое создание/обновление атрибутов

        POST /api/product-attributes/bulk/
        Body: {
            "product_ids": [1, 2, 3],
            "marketplace_id": 1,
            "attributes": [
                {"attribute_id": 10, "value_option_id": 100},
                {"attribute_id": 20, "value_string": "Значение"}
            ]
        }
        """
        serializer = BulkProductAttributeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attrs = serializer.save()

        return Response({
            'success': True,
            'created': len(attrs)
        }, status=status.HTTP_201_CREATED)


class ProductExportStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для статуса готовности товаров к экспорту

    Endpoints:
    - GET /api/export-status/ - статус всех товаров
    - GET /api/export-status/{id}/ - статус конкретного товара
    """

    queryset = Product.objects.all()
    serializer_class = ProductExportStatusSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('category', 'brand')

        # Фильтр по категории
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Фильтр только готовые к экспорту
        ready_only = self.request.query_params.get('ready_only')
        if ready_only and ready_only.lower() == 'true':
            # Это сложный фильтр, делаем его в сериализаторе
            pass

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset[:100]  # Ограничиваем для производительности
