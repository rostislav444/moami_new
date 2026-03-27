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

    @action(detail=False, methods=['post'], url_path='ai-assistant')
    def ai_assistant(self, request):
        """
        AI помощник для работы с категориями и маппингом.
        Принимает произвольный промпт + контекст.

        POST /category-mappings/ai-assistant/
        Body: {
            "marketplace_id": 1,
            "prompt": "Вот JSON категорий розетки: [...]. Создай категории и замапь с нашими.",
            "data": "любые данные (JSON, текст, список категорий)"
        }
        """
        import json as json_module
        from django.conf import settings as django_settings

        marketplace_id = request.data.get('marketplace_id')
        user_prompt = request.data.get('prompt', '')
        user_data = request.data.get('data', '')

        if not marketplace_id or not user_prompt:
            return Response(
                {'error': 'marketplace_id and prompt are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.marketplaces.models import Marketplace
        try:
            marketplace = Marketplace.objects.get(id=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response({'error': 'Marketplace not found'}, status=404)

        # Our categories
        from apps.categories.models import Category
        our_cats = list(Category.objects.all().order_by('tree_id', 'lft').values(
            'id', 'name', 'level', 'parent_id'
        ))
        our_cats_str = json_module.dumps(our_cats, ensure_ascii=False, indent=2)

        # Existing marketplace categories
        mp_cats = list(MarketplaceCategory.objects.filter(
            marketplace=marketplace
        ).values('id', 'name', 'external_id', 'external_code', 'parent_id'))
        mp_cats_str = json_module.dumps(mp_cats, ensure_ascii=False, indent=2)

        # Existing mappings
        existing_mappings = list(CategoryMapping.objects.filter(
            marketplace_category__marketplace=marketplace
        ).values('category_id', 'marketplace_category_id'))

        try:
            import anthropic
            client = anthropic.Anthropic(
                api_key=getattr(django_settings, 'ANTHROPIC_API_KEY', None)
            )

            system_prompt = f"""Ты AI-помощник для маркетплейс-интеграции магазина одежды/аксессуаров MOAMI.

МАРКЕТПЛЕЙС: {marketplace.name}

НАШИ КАТЕГОРИИ (id, name, level, parent_id):
{our_cats_str}

СУЩЕСТВУЮЩИЕ КАТЕГОРИИ МАРКЕТПЛЕЙСА:
{mp_cats_str if mp_cats else "Пусто — нужно создать"}

СУЩЕСТВУЮЩИЕ МАППИНГИ: {len(existing_mappings)} шт.

ЗАДАЧА: Для каждой нашей категории найди соответствующую категорию на маркетплейсе "{marketplace.name}".
Используй свои знания о структуре категорий этого маркетплейса (API, сайт, документация).

Для Rozetka: категории имеют числовые ID (напр. 2219 = Жіночий одяг, 4626 = Сукні, 4627 = Блузи, 4636 = Штани жіночі).
Для Epicentr: категории имеют числовые коды (напр. 6390 = Жіночий одяг).
Для Prom/Satu: используй стандартные коды.

Возвращай ТОЛЬКО JSON:
{{
  "actions": [
    {{"action": "create_mp_category", "name": "Назва категорії (укр)", "external_id": "12345", "external_code": "12345"}},
    {{"action": "create_mapping", "our_category_id": 1, "mp_category_name": "назва"}},
  ],
  "message": "Что сделал: перечисли созданные маппинги"
}}

ПРАВИЛА:
- create_mp_category: создаёт категорию маркетплейса. name — на украинском. external_id и external_code — реальные коды маркетплейса
- create_mapping: маппит нашу категорию (our_category_id) → категорию МП (по имени, mp_category_name должен точно совпадать с name в create_mp_category)
- Сначала все create_mp_category, потом все create_mapping
- Пропускай наши категории у которых level=0 (это корневые группы, не конечные)
- Ищи конечные (leaf) категории маркетплейса — самые специфичные
- Возвращай ТОЛЬКО JSON"""

            response = client.messages.create(
                model='claude-sonnet-4-20250514',
                max_tokens=8192,
                messages=[
                    {'role': 'user', 'content': f"{user_prompt}\n\nДАННЫЕ:\n{user_data}" if user_data else user_prompt},
                ],
                system=system_prompt,
            )

            # Log usage
            from apps.marketplaces.models import AIUsageLog
            AIUsageLog.log(response, 'claude-sonnet-4-20250514', 'category_assistant', marketplace=marketplace)

            text = response.content[0].text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()

            result = json_module.loads(text)
            actions = result.get('actions', [])
            message = result.get('message', '')

            # Execute actions
            created_categories = 0
            created_mappings = 0
            errors = []

            # First pass: create categories
            name_to_mp_cat = {}
            for a in actions:
                if a['action'] == 'create_mp_category':
                    try:
                        mc, created = MarketplaceCategory.objects.get_or_create(
                            marketplace=marketplace,
                            external_code=str(a.get('external_code', a.get('external_id', ''))),
                            defaults={
                                'name': a['name'],
                                'external_id': str(a.get('external_id', '')),
                                'parent_id': a.get('parent_id'),
                            }
                        )
                        name_to_mp_cat[a['name'].lower()] = mc
                        if created:
                            created_categories += 1
                    except Exception as e:
                        errors.append(f"create_mp_category {a.get('name')}: {str(e)[:100]}")

            # Second pass: create mappings
            for a in actions:
                if a['action'] == 'create_mapping':
                    try:
                        our_cat_id = a['our_category_id']
                        mp_cat_name = a.get('mp_category_name', '').lower()
                        mp_cat = name_to_mp_cat.get(mp_cat_name) or MarketplaceCategory.objects.filter(
                            marketplace=marketplace, name__iexact=a.get('mp_category_name', '')
                        ).first()
                        if mp_cat:
                            _, created = CategoryMapping.objects.get_or_create(
                                category_id=our_cat_id,
                                marketplace_category=mp_cat,
                            )
                            if created:
                                created_mappings += 1
                    except Exception as e:
                        errors.append(f"create_mapping: {str(e)[:100]}")

                elif a['action'] == 'create_mapping_by_ids':
                    try:
                        _, created = CategoryMapping.objects.get_or_create(
                            category_id=a['our_category_id'],
                            marketplace_category_id=a['mp_category_id'],
                        )
                        if created:
                            created_mappings += 1
                    except Exception as e:
                        errors.append(f"create_mapping_by_ids: {str(e)[:100]}")

            return Response({
                'success': True,
                'message': message,
                'created_categories': created_categories,
                'created_mappings': created_mappings,
                'errors': errors,
                'total_actions': len(actions),
            })

        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'AI assistant error: {e}')
            return Response({'error': str(e)}, status=500)
