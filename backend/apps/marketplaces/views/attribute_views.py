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

    @action(detail=True, methods=['post'], url_path='optimize-options')
    def optimize_options(self, request, pk=None):
        """
        Use AI to filter attribute options, keeping only relevant ones.

        POST /api/marketplace-attributes/{id}/optimize-options/
        Body: { "category_name": "Куртки" }  (optional context)
        """
        import anthropic
        from django.conf import settings

        attribute = self.get_object()
        if not attribute.has_options:
            return Response({'error': 'Attribute has no options'}, status=400)

        options = list(attribute.options.values_list('id', 'name', 'external_code'))
        if len(options) <= 30:
            return Response({'kept': len(options), 'deleted': 0, 'message': 'Too few options to optimize'})

        category_name = request.data.get('category_name', '')
        attr_set_name = attribute.attribute_set.name if attribute.attribute_set else ''

        # Build compact option list: code|name
        valid_codes = {code for _, _, code in options}
        options_text = '\n'.join(f'{code}|{name}' for _, name, code in options)

        attr_name_lower = attribute.name.lower()
        is_size = any(kw in attr_name_lower for kw in ('розмір', 'размер', 'size'))
        is_color = any(kw in attr_name_lower for kw in ('колір', 'цвет', 'color'))

        if is_size:
            filter_instruction = f"""Это атрибут РАЗМЕР для категории "{attr_set_name}".
Оставь ТОЛЬКО стандартные размеры для этой категории одежды:
- Для одежды: числовые UA размеры (34-56), буквенные (XS, S, M, L, XL, XXL, 3XL), EU размеры
- Для джинсов: W/L комбинации (W28-W42, L28-L36)
- Для обуви: числовые (35-47)
Удали все составные, редкие, с суффиксами (-Long, -Short, -Petite, -Regular, -Tall), двойные через дефис (25-26, 27-28), и прочий мусор.
Оставь 30-60 размеров."""
        elif is_color:
            filter_instruction = f"""Это атрибут ЦВЕТ для категории "{attr_set_name}".
Оставь 30-50 основных цветов: белый, чёрный, серый, красный, синий, зелёный, жёлтый, оранжевый, розовый, фиолетовый, коричневый, бежевый, бордовый, голубой, бирюзовый, хаки, мятный, лавандовый, пудровый, молочный, айвори, тауп, кофейный, серебряный, золотой, коралловый, персиковый, оливковый, горчичный, марсала и т.п.
Удали экзотические, составные и дублирующие оттенки."""
        else:
            filter_instruction = f"""Это атрибут "{attribute.name}" для категории "{attr_set_name}".
Оставь 20-50 самых распространённых и полезных значений. Удали редкие, специфичные, дублирующие."""

        prompt = f"""{filter_instruction}

Всего значений: {len(options)}
Формат: code|название

{options_text}

ОТВЕТЬ ТОЛЬКО кодами (первая колонка до |) которые ОСТАВИТЬ.
По одному коду на строку. БЕЗ пояснений, БЕЗ символов -, *, •."""

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model='claude-sonnet-4-20250514',
                max_tokens=8192,
                messages=[{'role': 'user', 'content': prompt}],
            )
            ai_text = response.content[0].text.strip()
        except Exception as e:
            return Response({'error': f'AI call failed: {str(e)}'}, status=500)

        # Parse codes — only accept codes that actually exist in options
        keep_codes = set()
        for line in ai_text.split('\n'):
            code = line.strip().strip('-').strip('*').strip('•').strip()
            # Ignore lines with explanatory text
            if not code or ' ' in code or len(code) > 50:
                continue
            if code in valid_codes:
                keep_codes.add(code)

        if not keep_codes or len(keep_codes) >= len(options):
            return Response({
                'error': f'AI result invalid: {len(keep_codes)} codes parsed from {len(options)} options',
                'ai_response_preview': ai_text[:500],
            }, status=500)

        # Safety: don't delete if AI wants to keep almost everything
        if len(keep_codes) > len(options) * 0.8:
            return Response({
                'error': f'AI kept too many ({len(keep_codes)}/{len(options)}), optimization skipped',
            }, status=400)

        # Delete options not in keep list
        to_delete = attribute.options.exclude(external_code__in=keep_codes)
        deleted_count = to_delete.count()
        to_delete.delete()
        remaining = attribute.options.count()

        return Response({
            'kept': remaining,
            'deleted': deleted_count,
            'total_before': len(options),
        })
