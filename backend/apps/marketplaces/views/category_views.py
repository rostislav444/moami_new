from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from apps.marketplaces.models import MarketplaceCategory, CategoryMapping
from apps.marketplaces.serializers import (
    MarketplaceCategorySerializer,
    MarketplaceCategoryTreeSerializer,
    CategoryMappingSerializer,
)
from apps.marketplaces.serializers.category_serializers import (
    CategoryMappingCreateSerializer,
    BulkCategoryMappingSerializer,
    MarketplaceCategoryWriteSerializer,
)


class CategoryPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class MarketplaceCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet для категорий маркетплейса

    Endpoints:
    - GET /api/marketplace-categories/ - список категорий (с пагинацией)
    - GET /api/marketplace-categories/{id}/ - детали категории
    - POST /api/marketplace-categories/ - создать категорию
    - PATCH /api/marketplace-categories/{id}/ - обновить категорию
    - DELETE /api/marketplace-categories/{id}/ - удалить категорию
    - GET /api/marketplace-categories/tree/ - дерево категорий (первый уровень)
    - GET /api/marketplace-categories/{id}/children/ - дети категории
    - POST /api/marketplace-categories/{id}/move/ - переместить категорию
    """

    queryset = MarketplaceCategory.objects.all()
    pagination_class = CategoryPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MarketplaceCategoryWriteSerializer
        return MarketplaceCategorySerializer

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

    def perform_create(self, serializer):
        """При создании обновляем has_children у родителя"""
        instance = serializer.save()
        if instance.parent:
            instance.parent.has_children = True
            instance.parent.save(update_fields=['has_children'])

    def perform_destroy(self, instance):
        """При удалении обновляем has_children у родителя"""
        parent = instance.parent
        instance.delete()
        if parent:
            # Проверяем остались ли дети
            parent.has_children = parent.children.exists()
            parent.save(update_fields=['has_children'])

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Дерево категорий (корневой уровень)

        GET /api/marketplace-categories/tree/?marketplace={id}
        Возвращает только корневые категории. Для получения детей
        используйте /{id}/children/
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
        ).order_by('name')

        serializer = MarketplaceCategorySerializer(root_categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Получить детей категории

        GET /api/marketplace-categories/{id}/children/
        """
        category = self.get_object()
        children = category.children.all().order_by('name')
        serializer = MarketplaceCategorySerializer(children, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def flat(self, request):
        """
        Плоский список категорий с пагинацией (для поиска)

        GET /api/marketplace-categories/flat/?marketplace={id}&search=блуз&page=1
        """
        marketplace_id = request.query_params.get('marketplace')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = MarketplaceCategory.objects.filter(
            marketplace_id=marketplace_id
        ).select_related('parent').order_by('name')

        # Поиск
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Только листовые
        leaf_only = request.query_params.get('leaf_only')
        if leaf_only and leaf_only.lower() == 'true':
            queryset = queryset.filter(has_children=False)

        # Пагинация
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = MarketplaceCategorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MarketplaceCategorySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """
        Переместить категорию к другому родителю

        POST /api/marketplace-categories/{id}/move/
        Body: {"parent_id": 123} или {"parent_id": null} для корня
        """
        category = self.get_object()
        new_parent_id = request.data.get('parent_id')

        old_parent = category.parent

        if new_parent_id:
            try:
                new_parent = MarketplaceCategory.objects.get(
                    id=new_parent_id,
                    marketplace=category.marketplace
                )
                # Проверяем что не пытаемся переместить в потомка
                if new_parent.id == category.id:
                    return Response(
                        {'error': 'Нельзя переместить категорию в саму себя'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                category.parent = new_parent
            except MarketplaceCategory.DoesNotExist:
                return Response(
                    {'error': 'Родительская категория не найдена'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            category.parent = None

        category.save()

        # Обновляем has_children у старого родителя
        if old_parent:
            old_parent.has_children = old_parent.children.exists()
            old_parent.save(update_fields=['has_children'])

        # Обновляем has_children у нового родителя
        if category.parent:
            category.parent.has_children = True
            category.parent.save(update_fields=['has_children'])

        return Response({
            'success': True,
            'category': MarketplaceCategorySerializer(category).data
        })


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

    @action(detail=False, methods=['post'], url_path='cleanup-unmapped')
    def cleanup_unmapped(self, request):
        """
        Удалить незамапленные категории маркетплейса

        POST /api/category-mappings/cleanup-unmapped/
        Body: { "marketplace_id": 1 }
        """
        marketplace_id = request.data.get('marketplace_id')
        if not marketplace_id:
            return Response(
                {'error': 'marketplace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.marketplaces.models import Marketplace
        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Marketplace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Collect mapped category IDs
        mapped_ids = set(CategoryMapping.objects.filter(
            marketplace_category__marketplace=marketplace
        ).values_list('marketplace_category_id', flat=True))

        # Collect ancestor IDs to preserve tree structure
        keep_ids = set(mapped_ids)
        for cat_id in mapped_ids:
            try:
                cat = MarketplaceCategory.objects.get(id=cat_id)
                parent = cat.parent
                while parent:
                    keep_ids.add(parent.id)
                    parent = parent.parent
            except MarketplaceCategory.DoesNotExist:
                pass

        # Delete unmapped categories
        to_delete = marketplace.categories.exclude(id__in=keep_ids)
        deleted_count = to_delete.count()
        to_delete.delete()

        # Update has_children flags
        for cat in marketplace.categories.all():
            actual = cat.children.exists()
            if cat.has_children != actual:
                cat.has_children = actual
                cat.save(update_fields=['has_children'])

        return Response({
            'success': True,
            'deleted': deleted_count,
            'remaining': marketplace.categories.count(),
        })

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
