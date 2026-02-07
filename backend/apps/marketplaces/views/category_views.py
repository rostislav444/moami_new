from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import MarketplaceCategory, CategoryMapping
from apps.marketplaces.serializers import (
    MarketplaceCategorySerializer,
    MarketplaceCategoryTreeSerializer,
    CategoryMappingSerializer,
)
from apps.marketplaces.serializers.category_serializers import (
    CategoryMappingCreateSerializer,
    BulkCategoryMappingSerializer,
)


class MarketplaceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для категорий маркетплейса (только чтение)

    Endpoints:
    - GET /api/marketplace-categories/ - список категорий
    - GET /api/marketplace-categories/{id}/ - детали категории
    - GET /api/marketplace-categories/tree/ - дерево категорий
    """

    queryset = MarketplaceCategory.objects.all()
    serializer_class = MarketplaceCategorySerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('marketplace', 'parent')

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)

        # Фильтр по активности
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Только листовые категории
        leaf_only = self.request.query_params.get('leaf_only')
        if leaf_only and leaf_only.lower() == 'true':
            queryset = queryset.filter(has_children=False)

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Дерево категорий

        GET /api/marketplace-categories/tree/?marketplace={id}
        """
        marketplace_id = request.query_params.get('marketplace')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем только корневые категории
        root_categories = MarketplaceCategory.objects.filter(
            marketplace_id=marketplace_id,
            parent__isnull=True
        ).prefetch_related('children')

        serializer = MarketplaceCategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)


class CategoryMappingViewSet(viewsets.ModelViewSet):
    """
    ViewSet для маппинга категорий

    Endpoints:
    - GET /api/category-mappings/ - список маппингов
    - POST /api/category-mappings/ - создать маппинг
    - DELETE /api/category-mappings/{id}/ - удалить маппинг
    - POST /api/category-mappings/bulk/ - массовое создание
    """

    queryset = CategoryMapping.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return CategoryMappingCreateSerializer
        if self.action == 'bulk_create':
            return BulkCategoryMappingSerializer
        return CategoryMappingSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'category',
            'marketplace_category',
            'marketplace_category__marketplace'
        )

        # Фильтр по нашей категории
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Фильтр по маркетплейсу
        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(
                marketplace_category__marketplace_id=marketplace_id
            )

        return queryset

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Массовое создание маппингов

        POST /api/category-mappings/bulk/
        Body: {
            "mappings": [
                {"category_id": 1, "marketplace_category_id": 10},
                {"category_id": 2, "marketplace_category_id": 20}
            ]
        }
        """
        serializer = BulkCategoryMappingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mappings = serializer.save()

        return Response({
            'success': True,
            'created': len(mappings)
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def auto_match(self, request):
        """
        Автоматический матчинг категорий по названию

        POST /api/category-mappings/auto-match/
        Body: {
            "marketplace_id": 1
        }
        """
        from apps.categories.models import Category

        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        matched = 0
        our_categories = Category.objects.all()
        marketplace_categories = MarketplaceCategory.objects.filter(
            marketplace_id=marketplace_id,
            is_active=True
        )

        for our_cat in our_categories:
            # Ищем совпадение по названию
            mp_cat = marketplace_categories.filter(
                name__iexact=our_cat.name
            ).first()

            if not mp_cat:
                mp_cat = marketplace_categories.filter(
                    name_uk__iexact=our_cat.name
                ).first()

            if mp_cat:
                _, created = CategoryMapping.objects.get_or_create(
                    category=our_cat,
                    marketplace_category=mp_cat
                )
                if created:
                    matched += 1

        return Response({
            'success': True,
            'matched': matched
        })
