from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from apps.product.models import Product, Variant, VariantSize, VariantImage
from apps.marketplaces.models import (
    Marketplace,
    CategoryMapping,
    MarketplaceAttributeLevel,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    ProductMarketplaceAttribute,
    BrandMapping,
    ColorMapping,
    CountryMapping,
)
from apps.marketplaces.serializers.product_admin_serializers import (
    ProductListAdminSerializer,
    ProductDetailAdminSerializer,
    SaveAttributesSerializer,
    ProductSaveAllSerializer,
)


class ProductAdminPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProductAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet для списка товаров в новой админке

    GET /admin-products/ — список товаров
    GET /admin-products/{id}/ — детали товара
    PATCH /admin-products/{id}/ — обновить товар (через save-all)
    GET /admin-products/{id}/marketplace-form/{marketplace_id}/ — форма атрибутов
    POST /admin-products/{id}/save-attributes/ — сохранить атрибуты
    POST /admin-products/{id}/save-all/ — сохранить всё (product + variants + sizes + attrs)
    POST /admin-products/{id}/upload-image/ — загрузить изображение
    """

    queryset = Product.objects.all()
    pagination_class = ProductAdminPagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailAdminSerializer
        return ProductListAdminSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'category', 'brand', 'country'
        ).prefetch_related(
            'variants', 'variants__images', 'variants__sizes',
            'variants__sizes__size', 'variants__color',
            'compositions', 'compositions__composition',
            'attributes', 'attributes__attribute_group',
            'attributes__value_single_attribute', 'attributes__value_multi_attributes',
        )

        # Фильтр по категории (включая потомков)
        category_id = self.request.query_params.get('category')
        if category_id:
            from apps.categories.models import Category
            try:
                cat = Category.objects.get(pk=category_id)
                descendant_ids = cat.get_descendants(include_self=True).values_list('id', flat=True)
                queryset = queryset.filter(category_id__in=descendant_ids)
            except Category.DoesNotExist:
                queryset = queryset.filter(category_id=category_id)

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )

        # Фильтр по бренду
        brand_id = self.request.query_params.get('brand')
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)

        return queryset.order_by('-id')

    @action(
        detail=True,
        methods=['get'],
        url_path='marketplace-form/(?P<marketplace_id>[0-9]+)'
    )
    def marketplace_form(self, request, pk=None, marketplace_id=None):
        """
        Форма атрибутов для маркетплейса.
        Возвращает атрибуты по уровням с текущими значениями.
        """
        product = self.get_object()

        try:
            marketplace = Marketplace.objects.get(pk=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Маркетплейс не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Найти маппинг категории
        cm = CategoryMapping.objects.filter(
            category=product.category,
            marketplace_category__marketplace=marketplace,
            is_active=True,
        ).select_related('marketplace_category').first()

        if not cm:
            return Response({
                'marketplace': {'id': marketplace.id, 'name': marketplace.name},
                'error': 'Категория не замаплена',
                'product_attributes': [],
                'brand_attributes': [],
                'variants': [],
            })

        # Найти attribute_set для mp_category
        mp_category = cm.marketplace_category
        attr_set = MarketplaceAttributeSet.objects.filter(
            marketplace=marketplace,
            marketplace_category=mp_category,
        ).first()
        if not attr_set:
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=marketplace,
                external_code=mp_category.external_code,
            ).first()
        if not attr_set:
            # Fallback: ищем по external_id категории
            attr_set = MarketplaceAttributeSet.objects.filter(
                marketplace=marketplace,
                external_code=mp_category.external_id,
            ).first()

        # Получить все атрибуты из набора
        all_mp_attributes = []
        has_attribute_set = attr_set is not None
        if attr_set:
            all_mp_attributes = list(
                attr_set.attributes.prefetch_related('options').all()
            )

        # Получить уровни атрибутов (если настроены)
        levels = MarketplaceAttributeLevel.objects.filter(
            category_mapping=cm
        ).select_related('marketplace_attribute')

        levels_map = {al.marketplace_attribute_id: al.level for al in levels}
        has_levels_configured = len(levels_map) > 0

        # Распределить атрибуты по уровням
        # Если levels не настроены — все идут на product level
        attrs_by_level = {'product': [], 'variant': [], 'size': [], 'brand': []}
        for attr in all_mp_attributes:
            level = levels_map.get(attr.id, 'product')  # default: product
            if level == 'skip':
                continue
            if level not in attrs_by_level:
                attrs_by_level[level] = []
            attrs_by_level[level].append(attr)

        # Получить текущие значения
        existing_values = ProductMarketplaceAttribute.objects.filter(
            product=product,
            marketplace_attribute__attribute_set__marketplace=marketplace,
        ).select_related('marketplace_attribute', 'value_option').prefetch_related('value_options')

        values_lookup = {}
        for val in existing_values:
            key = (val.marketplace_attribute_id, val.variant_id, val.variant_size_id)
            values_lookup[key] = val

        # Build product-level attributes
        product_attributes = self._build_attributes_from_list(
            attrs_by_level.get('product', []),
            values_lookup,
            variant_id=None,
            variant_size_id=None,
        )

        # Brand-level attributes
        brand_mapping = None
        if product.brand:
            brand_mapping = BrandMapping.objects.filter(
                brand=product.brand,
                marketplace_entity__marketplace=marketplace,
            ).select_related('marketplace_entity').first()

        brand_attributes = []
        for attr in attrs_by_level.get('brand', []):
            auto_value = None
            if brand_mapping:
                auto_value = {
                    'entity_id': brand_mapping.marketplace_entity.id,
                    'entity_name': brand_mapping.marketplace_entity.name,
                    'entity_external_id': brand_mapping.marketplace_entity.external_id,
                }
            brand_attributes.append({
                'mp_attribute_id': attr.id,
                'name': attr.name,
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'auto_value': auto_value,
                'our_brand': product.brand.name if product.brand else None,
            })

        # Variants
        variants = product.variants.prefetch_related(
            'images', 'sizes', 'sizes__size'
        ).all()

        # Country-level attributes
        country_mapping = None
        if product.country:
            country_mapping = CountryMapping.objects.filter(
                country=product.country,
                marketplace_entity__marketplace=marketplace,
            ).select_related('marketplace_entity').first()

        country_attributes = []
        for attr in attrs_by_level.get('country', []):
            auto_value = None
            if country_mapping:
                auto_value = {
                    'entity_id': country_mapping.marketplace_entity.id,
                    'entity_name': country_mapping.marketplace_entity.name,
                    'entity_external_id': country_mapping.marketplace_entity.external_id,
                }
            country_attributes.append({
                'mp_attribute_id': attr.id,
                'name': attr.name,
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'auto_value': auto_value,
                'our_country': product.country.name if product.country else None,
            })

        # Composition-level attributes
        composition_attributes = []
        compositions = product.compositions.select_related('composition').all()
        comp_str = ', '.join(f"{pc.composition.name} {pc.value}%" for pc in compositions)
        for attr in attrs_by_level.get('composition', []):
            composition_attributes.append({
                'mp_attribute_id': attr.id,
                'name': attr.name,
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'auto_value': comp_str if comp_str else None,
                'our_composition': comp_str or '—',
            })

        # Color-level attributes config
        color_attrs_config = attrs_by_level.get('color', [])

        variant_data = []
        for variant in variants:
            # Variant-level attributes
            v_attrs = self._build_attributes_from_list(
                attrs_by_level.get('variant', []),
                values_lookup,
                variant_id=variant.id,
                variant_size_id=None,
            )

            # Color auto-attributes
            color_attributes = []
            if color_attrs_config and variant.color:
                color_mapping = ColorMapping.objects.filter(
                    color=variant.color,
                    marketplace_entity__marketplace=marketplace,
                ).select_related('marketplace_entity').first()

                for attr in color_attrs_config:
                    auto_value = None
                    if color_mapping:
                        auto_value = {
                            'entity_id': color_mapping.marketplace_entity.id,
                            'entity_name': color_mapping.marketplace_entity.name,
                            'entity_external_id': color_mapping.marketplace_entity.external_id,
                        }
                    color_attributes.append({
                        'mp_attribute_id': attr.id,
                        'name': attr.name,
                        'attr_type': attr.attr_type,
                        'is_required': attr.is_required,
                        'auto_value': auto_value,
                        'our_color': variant.color.name,
                    })

            # Sizes with size-level attributes
            sizes_data = []
            for vs in variant.sizes.all():
                s_attrs = self._build_attributes_from_list(
                    attrs_by_level.get('size', []),
                    values_lookup,
                    variant_id=variant.id,
                    variant_size_id=vs.id,
                )
                sizes_data.append({
                    'variant_size_id': vs.id,
                    'size_name': str(vs.size) if vs.size else '',
                    'sku': vs.sku,
                    'stock': vs.stock,
                    'attributes': s_attrs,
                })

            first_image = variant.images.first()
            image_url = None
            if first_image:
                thumb = first_image.thumbnails.get('s') or first_image.thumbnails.get('xs')
                if thumb:
                    from django.conf import settings
                    image_url = f'{settings.MEDIA_URL}{thumb}'
                elif first_image.image:
                    image_url = first_image.image.url

            variant_data.append({
                'variant_id': variant.id,
                'code': variant.code,
                'color_name': variant.color.name if variant.color else '',
                'image_url': image_url,
                'attributes': v_attrs,
                'color_attributes': color_attributes,
                'sizes': sizes_data,
            })

        return Response({
            'marketplace': {'id': marketplace.id, 'name': marketplace.name},
            'category_mapping_id': cm.id,
            'mp_category_name': cm.marketplace_category.name,
            'mp_category_code': cm.marketplace_category.external_code,
            'has_attribute_set': has_attribute_set,
            'attribute_set_name': attr_set.name if attr_set else None,
            'total_attributes': len(all_mp_attributes),
            'levels_configured': len(levels_map) > 0,
            'product_attributes': product_attributes,
            'brand_attributes': brand_attributes,
            'country_attributes': country_attributes,
            'composition_attributes': composition_attributes,
            'variants': variant_data,
        })

    def _build_attributes_from_list(self, mp_attributes, values_lookup, variant_id, variant_size_id):
        """Построить список атрибутов с текущими значениями"""
        result = []
        for attr in mp_attributes:
            val = values_lookup.get((attr.id, variant_id, variant_size_id))

            current_value = None
            if val:
                current_value = self._serialize_value(val)

            attr_data = {
                'mp_attribute_id': attr.id,
                'external_code': attr.external_code,
                'name': attr.name,
                'name_uk': attr.name_uk or '',
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'is_system': attr.is_system,
                'group_name': attr.group_name or '',
                'suffix': attr.suffix or '',
                'current_value': current_value,
            }

            if attr.has_options:
                # Get options — from this attr or shared via external_code
                options_qs = attr.options.all()
                if not options_qs.exists():
                    from apps.marketplaces.models import MarketplaceAttributeOption
                    # Find options from sibling attribute with same code
                    options_qs = MarketplaceAttributeOption.objects.filter(
                        attribute__external_code=attr.external_code,
                        attribute__attribute_set__marketplace=attr.attribute_set.marketplace,
                    ).order_by('external_code', 'id').distinct('external_code')

                attr_data['options'] = [
                    {
                        'id': opt.id,
                        'code': opt.external_code,
                        'name': opt.name,
                        'name_uk': opt.name_uk or '',
                    }
                    for opt in options_qs
                ]

            result.append(attr_data)

        return result

    def _serialize_value(self, val):
        """Сериализовать текущее значение"""
        attr_type = val.marketplace_attribute.attr_type

        if attr_type == 'select':
            if val.value_option:
                return {
                    'type': 'option',
                    'value': val.value_option_id,
                    'display': val.value_option.name,
                }
        elif attr_type == 'multiselect':
            options = list(val.value_options.all())
            if options:
                return {
                    'type': 'options',
                    'value': [o.id for o in options],
                    'display': ', '.join(o.name for o in options),
                }
        elif attr_type == 'string':
            if val.value_string:
                return {'type': 'string', 'value': val.value_string, 'value_uk': val.value_string_uk}
        elif attr_type == 'text':
            if val.value_text:
                return {'type': 'text', 'value': val.value_text, 'value_uk': val.value_text_uk}
        elif attr_type == 'int':
            if val.value_int is not None:
                return {'type': 'int', 'value': val.value_int}
        elif attr_type == 'float':
            if val.value_float is not None:
                return {'type': 'float', 'value': val.value_float}
        elif attr_type == 'boolean':
            if val.value_boolean is not None:
                return {'type': 'boolean', 'value': val.value_boolean}

        return None

    @action(detail=True, methods=['post'], url_path='save-attributes')
    def save_attributes(self, request, pk=None):
        """
        Сохранить заполненные атрибуты товара для маркетплейса.

        POST /admin-products/{id}/save-attributes/
        Body: {
            "marketplace_id": 1,
            "product_attributes": [
                {"mp_attribute_id": 10, "value_option": 100},
                {"mp_attribute_id": 20, "value_string": "Значение"}
            ],
            "variant_attributes": [
                {"variant_id": 5, "mp_attribute_id": 30, "value_option": 200}
            ],
            "size_attributes": [
                {"variant_id": 5, "variant_size_id": 15, "mp_attribute_id": 40, "value_string": "XL"}
            ]
        }
        """
        product = self.get_object()
        serializer = SaveAttributesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save_for_product(product)

        return Response({
            'success': True,
            'saved': saved,
        })

    @action(detail=True, methods=['post'], url_path='save-all')
    def save_all(self, request, pk=None):
        """
        Save all product data in one request.

        POST /admin-products/{id}/save-all/
        """
        product = self.get_object()
        serializer = ProductSaveAllSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save_for_product(product)

        # Return updated product
        detail_serializer = ProductDetailAdminSerializer(product)
        return Response(detail_serializer.data)

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-image',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request, pk=None):
        """
        Upload image for a variant.

        POST /admin-products/{id}/upload-image/
        Body (multipart): variant_id, image (file)
        """
        product = self.get_object()
        variant_id = request.data.get('variant_id')
        image_file = request.FILES.get('image')

        if not variant_id or not image_file:
            return Response(
                {'error': 'variant_id and image are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            variant = Variant.objects.get(id=variant_id, product=product)
        except Variant.DoesNotExist:
            return Response(
                {'error': 'Variant not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        max_index = variant.images.order_by('-index').values_list('index', flat=True).first() or 0
        vi = VariantImage.objects.create(
            variant=variant,
            image=image_file,
            index=max_index + 1,
        )

        from django.conf import settings as django_settings
        thumb = vi.thumbnails.get('m') or vi.thumbnails.get('s')
        thumbnail_url = f'{django_settings.MEDIA_URL}{thumb}' if thumb else None

        return Response({
            'id': vi.id,
            'index': vi.index,
            'exclude_at_marketplace': vi.exclude_at_marketplace,
            'url': f'{django_settings.MEDIA_URL}{vi.image.name}' if vi.image else None,
            'thumbnail': thumbnail_url or (f'{django_settings.MEDIA_URL}{vi.image.name}' if vi.image else None),
        })

    @action(detail=False, methods=['post'], url_path='bulk-ai-fill')
    def bulk_ai_fill(self, request):
        """
        Запустить массовое AI заполнение всех товаров для маркетплейса.

        POST /admin-products/bulk-ai-fill/
        Body: {"marketplace_id": 1, "with_images": false}
        """
        marketplace_id = request.data.get('marketplace_id')
        with_images = request.data.get('with_images', False)

        if not marketplace_id:
            return Response({'error': 'marketplace_id required'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.marketplaces.services.bulk_ai_fill import start_bulk_ai_fill
        task = start_bulk_ai_fill(marketplace_id, with_images=with_images)

        return Response({
            'task_id': task.id,
            'status': task.status,
        })

    @action(detail=False, methods=['get'], url_path='bulk-ai-fill-status/(?P<task_id>[0-9]+)')
    def bulk_ai_fill_status(self, request, task_id=None):
        """Статус массового AI заполнения"""
        from apps.marketplaces.models import BackgroundTask
        try:
            task = BackgroundTask.objects.get(id=task_id)
        except BackgroundTask.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'task_id': task.id,
            'status': task.status,
            'progress': task.progress,
            'progress_message': task.progress_message,
            'result': task.result,
            'error': task.error,
        })

    @action(detail=True, methods=['post'], url_path='ai-fill-base')
    def ai_fill_base(self, request, pk=None):
        """
        AI заполнение базовых данных товара по фото.
        Заполняет описание, состав, наши характеристики.

        POST /admin-products/{id}/ai-fill-base/
        """
        product = self.get_object()

        # Get attribute groups for product's category
        from apps.categories.models import CategoryAttributeGroup
        ancestor_ids = list(
            product.category.get_ancestors(include_self=True).values_list('id', flat=True)
        ) if product.category else []

        cags = CategoryAttributeGroup.objects.filter(
            category_id__in=ancestor_ids
        ).select_related('attribute_group').prefetch_related('attribute_group__attributes')

        seen = set()
        attribute_groups = []
        for cag in cags:
            ag = cag.attribute_group
            if ag.id in seen:
                continue
            seen.add(ag.id)
            attribute_groups.append({
                'id': ag.id,
                'name': ag.name,
                'data_type': ag.data_type,
                'required': cag.required,
                'attributes': list(ag.attributes.all().order_by('name').values('id', 'name')),
            })

        from apps.marketplaces.services.ai_attribute_filler import ai_fill_base_product_data
        result = ai_fill_base_product_data(product, attribute_groups)
        return Response(result)

    @action(
        detail=True,
        methods=['post'],
        url_path='ai-fill/(?P<marketplace_id>[0-9]+)'
    )
    def ai_fill(self, request, pk=None, marketplace_id=None):
        """
        AI автозаполнение атрибутов товара через Claude Haiku.

        POST /admin-products/{id}/ai-fill/{marketplace_id}/
        Returns: { success, filled: { attr_id: value }, reasoning }
        """
        product = self.get_object()

        try:
            marketplace = Marketplace.objects.get(pk=marketplace_id)
        except Marketplace.DoesNotExist:
            return Response(
                {'error': 'Маркетплейс не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Получить форму атрибутов (reuse marketplace_form logic)
        form_response = self.marketplace_form(request, pk=pk, marketplace_id=marketplace_id)
        form_data = form_response.data

        if form_data.get('error'):
            return Response({
                'success': False,
                'error': form_data['error'],
            })

        from apps.marketplaces.services.ai_attribute_filler import ai_fill_product_attributes

        with_images = request.data.get('with_images', False)

        result = ai_fill_product_attributes(
            product=product,
            marketplace=marketplace,
            form_data=form_data,
            with_images=with_images,
        )

        return Response(result)
