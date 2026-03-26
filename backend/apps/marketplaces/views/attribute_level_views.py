from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceAttributeLevel,
    CategoryMapping,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
)
from apps.marketplaces.serializers.attribute_level_serializers import (
    MarketplaceAttributeLevelSerializer,
    BulkAttributeLevelSerializer,
)


class MarketplaceAttributeLevelViewSet(viewsets.ModelViewSet):
    """
    ViewSet для уровней атрибутов

    Endpoints:
    - GET /attribute-levels/?category_mapping=X — уровни
    - POST /attribute-levels/ — создать/обновить
    - POST /attribute-levels/bulk_update/ — массовая установка
    - GET /attribute-levels/config/{category_mapping_id}/ — полная конфигурация
    """

    queryset = MarketplaceAttributeLevel.objects.all()
    serializer_class = MarketplaceAttributeLevelSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'marketplace_attribute',
            'marketplace_attribute__attribute_set',
            'category_mapping',
        )

        category_mapping_id = self.request.query_params.get('category_mapping')
        if category_mapping_id:
            queryset = queryset.filter(category_mapping_id=category_mapping_id)

        marketplace_id = self.request.query_params.get('marketplace')
        if marketplace_id:
            queryset = queryset.filter(
                category_mapping__marketplace_category__marketplace_id=marketplace_id
            )

        return queryset

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Массовая установка уровней"""
        serializer = BulkAttributeLevelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()

        return Response({
            'success': True,
            'updated': len(created),
        })

    @action(detail=False, methods=['get'], url_path='config/(?P<category_mapping_id>[0-9]+)')
    def config(self, request, category_mapping_id=None):
        """
        Полная конфигурация атрибутов для CategoryMapping.
        Возвращает все mp-атрибуты с текущими уровнями.
        """
        try:
            cm = CategoryMapping.objects.select_related(
                'category', 'marketplace_category'
            ).get(pk=category_mapping_id)
        except CategoryMapping.DoesNotExist:
            return Response(
                {'error': 'CategoryMapping не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        mp_category = cm.marketplace_category

        # Найти attribute_set для mp_category
        attr_set = MarketplaceAttributeSet.objects.filter(
            marketplace=mp_category.marketplace,
            marketplace_category=mp_category,
        ).first()

        if not attr_set:
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=mp_category.marketplace,
                external_code=mp_category.external_code,
            ).first()

        if not attr_set:
            return Response({
                'category_mapping_id': cm.id,
                'our_category_id': cm.category_id,
                'our_category_name': cm.category.name,
                'mp_category_id': mp_category.id,
                'mp_category_name': mp_category.name,
                'mp_category_code': mp_category.external_code,
                'attribute_set_id': None,
                'attribute_set_name': '',
                'total_attributes': 0,
                'configured_attributes': 0,
                'attributes': [],
            })

        # Получить все атрибуты
        mp_attributes = attr_set.attributes.prefetch_related('options').all()

        # Получить текущие уровни
        existing_levels = {
            al.marketplace_attribute_id: al
            for al in MarketplaceAttributeLevel.objects.filter(
                category_mapping=cm
            )
        }

        attributes = []
        for attr in mp_attributes:
            level_obj = existing_levels.get(attr.id)
            attributes.append({
                'mp_attribute_id': attr.id,
                'external_code': attr.external_code,
                'name': attr.name,
                'name_uk': attr.name_uk or '',
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'is_system': attr.is_system,
                'group_name': attr.group_name or '',
                'suffix': attr.suffix or '',
                'options_count': attr.options.count() if attr.has_options else 0,
                'level': level_obj.level if level_obj else None,
                'level_id': level_obj.id if level_obj else None,
            })

        return Response({
            'category_mapping_id': cm.id,
            'our_category_id': cm.category_id,
            'our_category_name': cm.category.name,
            'mp_category_id': mp_category.id,
            'mp_category_name': mp_category.name,
            'mp_category_code': mp_category.external_code,
            'attribute_set_id': attr_set.id,
            'attribute_set_name': attr_set.name,
            'total_attributes': len(attributes),
            'configured_attributes': len(existing_levels),
            'attributes': attributes,
        })

    @action(detail=False, methods=['get'], url_path='mappings-list/(?P<marketplace_id>[0-9]+)')
    def mappings_list(self, request, marketplace_id=None):
        """
        Список всех CategoryMapping для маркетплейса с кратким статусом.
        """
        mappings = CategoryMapping.objects.filter(
            marketplace_category__marketplace_id=marketplace_id,
            is_active=True,
        ).select_related('category', 'marketplace_category')

        result = []
        for cm in mappings:
            configured = MarketplaceAttributeLevel.objects.filter(
                category_mapping=cm
            ).count()

            # Подсчитать атрибуты
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace_id=marketplace_id,
                marketplace_category=cm.marketplace_category,
            ).first() or MarketplaceAttributeSet.objects.filter(
                marketplace_id=marketplace_id,
                external_code=cm.marketplace_category.external_code,
            ).first()

            total = attr_set.attributes.count() if attr_set else 0

            result.append({
                'category_mapping_id': cm.id,
                'our_category_id': cm.category_id,
                'our_category_name': cm.category.name,
                'mp_category_id': cm.marketplace_category_id,
                'mp_category_name': cm.marketplace_category.name,
                'mp_category_code': cm.marketplace_category.external_code,
                'total_attributes': total,
                'configured_attributes': configured,
            })

        return Response(result)

    @action(detail=False, methods=['post'], url_path='ai-assign/(?P<marketplace_id>[0-9]+)')
    def ai_assign(self, request, marketplace_id=None):
        """
        AI автоназначение уровней — категория за категорией.
        POST /attribute-levels/ai-assign/{marketplace_id}/
        """
        import json
        import logging
        from django.conf import settings

        try:
            import anthropic
        except ImportError:
            return Response({'error': 'anthropic not installed'}, status=400)

        marketplace = Marketplace.objects.filter(id=marketplace_id).first()
        if not marketplace:
            return Response({'error': 'Маркетплейс не найден'}, status=404)

        client = anthropic.Anthropic(
            api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
        )

        mappings = CategoryMapping.objects.filter(
            marketplace_category__marketplace=marketplace,
            is_active=True,
        ).select_related('category', 'marketplace_category')

        total_saved = 0
        categories_processed = 0
        errors = []

        for cm in mappings:
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=marketplace,
                marketplace_category=cm.marketplace_category,
            ).first() or MarketplaceAttributeSet.objects.filter(
                marketplace=marketplace,
                external_code=cm.marketplace_category.external_code,
            ).first()

            if not attr_set:
                continue

            attrs = list(attr_set.attributes.all())
            if not attrs:
                continue

            attrs_desc = '\n'.join(
                f'id={a.id} code="{a.external_code}" name="{a.name}" '
                f'type={a.attr_type} required={a.is_required}'
                for a in attrs
            )

            prompt = f"""Магазин одежды/аксессуаров → маркетплейс. Назначь уровень каждому атрибуту.

Категория: {cm.category.name} → {cm.marketplace_category.name}

Атрибуты:
{attrs_desc}

Уровни (выбери один для каждого атрибута):

- product — общие характеристики товара, одинаковые для всех размеров и вариантов:
  пол, сезон, стиль, фасон, описание, вес упаковки, габариты УПАКОВКИ (высота/ширина/глубина упаковки),
  мера измерения, минимальная кратность, тип застёжки, длина рукава, силуэт, посадка, назначение

- size — всё что РАЗЛИЧАЕТСЯ между размерами одного товара:
  размер (EU/UA/INT/US), габариты ИЗДЕЛИЯ (длина изделия, ширина изделия, обхват груди/талии/бёдер),
  вес изделия если зависит от размера

- variant — специфичное для цветового варианта (очень редко, почти не используется)

- brand — бренд (code="brand" или название "бренд"/"brand"/"торговая марка")
- color — цвет (code: 78, 12097, 12361, или название содержит "цвет"/"colour"/"color")
- country — страна производства (code="country_of_origin" или "страна"/"country"/"производств")
- composition — состав/материал ткани ("материал"/"состав"/"ткань"/"material"/"fabric"/"composition")

- skip — бесполезные: штрих-код/barcode, EAN/GTIN, популярные запросы, обмен и возврат,
  коллекция, ratio/кратность заказа, идентификаторы

ВАЖНО:
- Отличай "габариты упаковки" (product) от "габариты изделия" (size)
- Размерные сетки (EU, UA, INT, US) → size
- Если сомневаешься между product и size — выбирай product

Ответь ТОЛЬКО JSON: {{"<attr_id>": "<level>", ...}}"""

            try:
                response = client.messages.create(
                    model='claude-haiku-4-5-20251001',
                    max_tokens=2048,
                    messages=[{'role': 'user', 'content': prompt}],
                )

                # Log usage
                from apps.marketplaces.models import AIUsageLog
                AIUsageLog.log(response, 'claude-haiku-4-5-20251001', 'assign_levels',
                               marketplace=marketplace)

                text = response.content[0].text.strip()
                if '```json' in text:
                    text = text.split('```json')[1].split('```')[0].strip()
                elif '```' in text:
                    text = text.split('```')[1].split('```')[0].strip()

                attr_levels = json.loads(text)

                for attr_id_str, level in attr_levels.items():
                    attr_id = int(attr_id_str)
                    if level in ('product', 'variant', 'size', 'brand', 'color', 'country', 'composition', 'skip'):
                        MarketplaceAttributeLevel.objects.update_or_create(
                            category_mapping_id=cm.id,
                            marketplace_attribute_id=attr_id,
                            defaults={'level': level}
                        )
                        total_saved += 1

                categories_processed += 1

            except Exception as e:
                errors.append(f'{cm.category.name}: {str(e)}')
                logging.getLogger(__name__).error(f'AI assign error for {cm.category.name}: {e}')

        return Response({
            'success': len(errors) == 0,
            'saved': total_saved,
            'categories_processed': categories_processed,
            'errors': errors,
        })
