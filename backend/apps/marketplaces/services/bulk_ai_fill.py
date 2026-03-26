"""
Массовое AI-заполнение атрибутов всех товаров для маркетплейса.
Запускается в фоне через threading.
"""
import logging
import threading

from apps.marketplaces.models import (
    Marketplace,
    BackgroundTask,
)

logger = logging.getLogger(__name__)


def start_bulk_ai_fill(marketplace_id: int, with_images: bool = False) -> BackgroundTask:
    """Создать задачу и запустить в фоне"""
    marketplace = Marketplace.objects.get(id=marketplace_id)

    task = BackgroundTask.objects.create(
        task_type='ai_processing',
        name=f'AI заполнение: {marketplace.name}',
        payload={
            'marketplace_id': marketplace_id,
            'with_images': with_images,
        },
    )

    thread = threading.Thread(
        target=_run_bulk_fill,
        args=(task.id,),
        daemon=True,
    )
    thread.start()

    return task


def _run_bulk_fill(task_id: int):
    """Фоновый процесс заполнения"""
    import django
    django.setup()

    from django.db import connection
    connection.ensure_connection()

    task = BackgroundTask.objects.get(id=task_id)
    task.start()

    marketplace_id = task.payload['marketplace_id']
    with_images = task.payload.get('with_images', False)

    try:
        marketplace = Marketplace.objects.get(id=marketplace_id)

        from apps.product.models import Product
        from apps.marketplaces.views.product_admin_views import ProductAdminViewSet
        from apps.marketplaces.services.ai_attribute_filler import ai_fill_product_attributes
        from apps.marketplaces.models import (
            CategoryMapping,
            MarketplaceAttributeLevel,
            MarketplaceAttributeSet,
            ProductMarketplaceAttribute,
            BrandMapping,
            ColorMapping,
            CountryMapping,
        )

        products = Product.objects.select_related(
            'category', 'brand', 'country'
        ).prefetch_related('variants').all()

        total = products.count()
        filled_count = 0
        error_count = 0
        skipped_count = 0
        errors = []

        for idx, product in enumerate(products):
            if task.status == 'cancelled':
                break

            task.update_progress(
                int((idx / total) * 100),
                f'{product.name[:50]}... ({idx + 1}/{total})'
            )

            try:
                # Build form_data same as marketplace_form endpoint
                form_data = _build_form_data(product, marketplace)
                if not form_data or form_data.get('error'):
                    skipped_count += 1
                    continue

                # Check if has any unfilled attributes
                has_product_attrs = len(form_data.get('product_attributes', [])) > 0
                has_variant_attrs = any(
                    v.get('attributes') for v in form_data.get('variants', [])
                )
                has_size_attrs = any(
                    s.get('attributes')
                    for v in form_data.get('variants', [])
                    for s in v.get('sizes', [])
                )

                if not (has_product_attrs or has_variant_attrs or has_size_attrs):
                    skipped_count += 1
                    continue

                # Call AI fill
                result = ai_fill_product_attributes(
                    product=product,
                    marketplace=marketplace,
                    form_data=form_data,
                    with_images=with_images,
                )

                if not result.get('success'):
                    error_count += 1
                    errors.append(f'{product.name}: {result.get("error", "unknown")}')
                    continue

                # Save filled attributes
                saved = _save_ai_result(product, marketplace, result)
                if saved > 0:
                    filled_count += 1

            except Exception as e:
                error_count += 1
                errors.append(f'{product.name}: {str(e)[:100]}')
                logger.error(f'Bulk AI fill error for product {product.id}: {e}')

        task.complete(result={
            'total': total,
            'filled': filled_count,
            'skipped': skipped_count,
            'errors': error_count,
            'error_details': errors[:20],
        })

    except Exception as e:
        logger.error(f'Bulk AI fill fatal error: {e}')
        task.fail(str(e))


def _build_form_data(product, marketplace):
    """Build marketplace form data for a product (same logic as marketplace_form endpoint)"""
    from apps.marketplaces.models import (
        CategoryMapping,
        MarketplaceAttributeLevel,
        MarketplaceAttributeSet,
        ProductMarketplaceAttribute,
        BrandMapping,
        ColorMapping,
        CountryMapping,
    )

    cm = CategoryMapping.objects.filter(
        category=product.category,
        marketplace_category__marketplace=marketplace,
        is_active=True,
    ).select_related('marketplace_category').first()

    if not cm:
        return {'error': 'no mapping'}

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
        return {'error': 'no attr set'}

    all_mp_attributes = list(attr_set.attributes.prefetch_related('options').all())

    levels = MarketplaceAttributeLevel.objects.filter(category_mapping=cm)
    levels_map = {al.marketplace_attribute_id: al.level for al in levels}

    attrs_by_level = {}
    for attr in all_mp_attributes:
        level = levels_map.get(attr.id, 'product')
        if level == 'skip':
            continue
        attrs_by_level.setdefault(level, []).append(attr)

    # Existing values
    existing_values = ProductMarketplaceAttribute.objects.filter(
        product=product,
        marketplace_attribute__attribute_set__marketplace=marketplace,
    ).select_related('marketplace_attribute', 'value_option').prefetch_related('value_options')

    values_lookup = {}
    for val in existing_values:
        key = (val.marketplace_attribute_id, val.variant_id, val.variant_size_id)
        values_lookup[key] = val

    def build_attrs(mp_attrs, variant_id=None, variant_size_id=None):
        result = []
        for attr in mp_attrs:
            attr_data = {
                'mp_attribute_id': attr.id,
                'external_code': attr.external_code,
                'name': attr.name,
                'attr_type': attr.attr_type,
                'is_required': attr.is_required,
                'suffix': attr.suffix or '',
            }
            if attr.has_options:
                attr_data['options'] = [
                    {'id': o.id, 'code': o.external_code, 'name': o.name}
                    for o in attr.options.all()
                ]
            result.append(attr_data)
        return result

    product_attributes = build_attrs(attrs_by_level.get('product', []))

    variants = product.variants.prefetch_related(
        'images', 'sizes', 'sizes__size', 'sizes__size__interpretations__grid'
    ).select_related('color').all()

    variant_data = []
    for variant in variants:
        v_attrs = build_attrs(attrs_by_level.get('variant', []))

        sizes_data = []
        for vs in variant.sizes.all():
            s_attrs = build_attrs(attrs_by_level.get('size', []))
            sizes_data.append({
                'variant_size_id': vs.id,
                'size_name': str(vs.size) if vs.size else '',
                'sku': vs.sku,
                'stock': vs.stock,
                'attributes': s_attrs,
            })

        variant_data.append({
            'variant_id': variant.id,
            'code': variant.code,
            'color_name': variant.color.name if variant.color else '',
            'attributes': v_attrs,
            'sizes': sizes_data,
        })

    return {
        'product_attributes': product_attributes,
        'variants': variant_data,
    }


def _save_ai_result(product, marketplace, result):
    """Save AI-filled attributes to database"""
    from apps.marketplaces.models import (
        ProductMarketplaceAttribute,
        ProductMarketplaceConfig,
        MarketplaceAttributeOption,
    )

    ProductMarketplaceConfig.objects.get_or_create(
        product=product,
        marketplace=marketplace,
        defaults={'is_active': True},
    )

    saved = 0

    def save_attr(mp_attr_id, value, variant_id=None, variant_size_id=None):
        nonlocal saved
        if value is None:
            return

        from apps.marketplaces.models import MarketplaceAttribute
        try:
            mp_attr = MarketplaceAttribute.objects.get(id=mp_attr_id)
        except MarketplaceAttribute.DoesNotExist:
            return

        defaults = {}
        if mp_attr.attr_type == 'select' and isinstance(value, int):
            if MarketplaceAttributeOption.objects.filter(id=value).exists():
                defaults['value_option_id'] = value
            else:
                return
        elif mp_attr.attr_type in ('int',):
            defaults['value_int'] = int(value) if value else None
        elif mp_attr.attr_type in ('float',):
            defaults['value_float'] = float(value) if value else None
        elif mp_attr.attr_type == 'string':
            defaults['value_string'] = str(value) if value else ''
        elif mp_attr.attr_type == 'text':
            defaults['value_text'] = str(value) if value else ''
        elif mp_attr.attr_type == 'boolean':
            defaults['value_boolean'] = bool(value)
        else:
            defaults['value_string'] = str(value) if value else ''

        obj, _ = ProductMarketplaceAttribute.objects.update_or_create(
            product=product,
            marketplace_attribute_id=mp_attr_id,
            variant_id=variant_id,
            variant_size_id=variant_size_id,
            defaults=defaults,
        )

        # Multiselect
        if mp_attr.attr_type == 'multiselect' and isinstance(value, list):
            valid_ids = list(MarketplaceAttributeOption.objects.filter(
                id__in=value
            ).values_list('id', flat=True))
            obj.value_options.set(valid_ids)

        saved += 1

    # Product-level
    for attr_id, value in result.get('filled_product', {}).items():
        save_attr(attr_id, value)

    # Variant-level
    for vid_str, attrs in result.get('filled_variants', {}).items():
        vid = int(vid_str)
        for attr_id, value in attrs.items():
            save_attr(attr_id, value, variant_id=vid)

    # Size-level
    for vsid_str, attrs in result.get('filled_sizes', {}).items():
        vsid = int(vsid_str)
        # Find variant_id for this variant_size
        from apps.product.models import VariantSize
        try:
            vs = VariantSize.objects.get(id=vsid)
            for attr_id, value in attrs.items():
                save_attr(attr_id, value, variant_id=vs.variant_id, variant_size_id=vsid)
        except VariantSize.DoesNotExist:
            pass

    return saved
