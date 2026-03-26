"""
Динамический генератор фидов для маркетплейсов.
Рендерит Django-шаблоны из FeedTemplate с данными из ProductMarketplaceAttribute.
"""
import logging
import re
import time as time_module
from datetime import datetime
from typing import Dict, List, Optional

from django.conf import settings
from django.template import Template, Context

from apps.marketplaces.models import (
    Marketplace,
    FeedTemplate,
    CategoryMapping,
    ProductMarketplaceAttribute,
    ProductMarketplaceConfig,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
    MarketplaceAttributeLevel,
)
from apps.product.models import Product

logger = logging.getLogger(__name__)

SITE_URL = getattr(settings, 'SITE_URL', 'https://moami.com.ua')


class FeedGenerator:
    """Генератор фида для маркетплейса"""

    def __init__(self, marketplace: Marketplace):
        self.marketplace = marketplace
        self._load_mappings()

    def _load_mappings(self):
        """Предзагрузка всех маппингов для bulk-доступа"""
        mp = self.marketplace

        # Category mappings: our_category_id → mp_category
        self.category_map = {}
        for cm in CategoryMapping.objects.filter(
            marketplace_category__marketplace=mp, is_active=True
        ).select_related('category', 'marketplace_category'):
            self.category_map[cm.category_id] = cm

        # Brand mappings: brand_id → entity
        self.brand_map = {}
        for bm in BrandMapping.objects.filter(
            marketplace_entity__marketplace=mp
        ).select_related('brand', 'marketplace_entity'):
            self.brand_map[bm.brand_id] = bm.marketplace_entity

        # Color mappings: color_id → entity
        self.color_map = {}
        for cm in ColorMapping.objects.filter(
            marketplace_entity__marketplace=mp
        ).select_related('color', 'marketplace_entity'):
            self.color_map[cm.color_id] = cm.marketplace_entity

        # Country mappings: country_id → entity
        self.country_map = {}
        for cm in CountryMapping.objects.filter(
            marketplace_entity__marketplace=mp
        ).select_related('country', 'marketplace_entity'):
            self.country_map[cm.country_id] = cm.marketplace_entity

        # Size mappings: size_id → entity
        self.size_map = {}
        for sm in SizeMapping.objects.filter(
            marketplace_entity__marketplace=mp
        ).select_related('size', 'marketplace_entity'):
            self.size_map[sm.size_id] = sm.marketplace_entity

    def generate(self, product_id: Optional[int] = None) -> Dict:
        """
        Генерация фида.
        product_id — если указан, генерирует только для одного товара (preview).
        Returns: {xml, products_count, generation_time}
        """
        start = time_module.time()

        templates = self._load_templates()
        if not templates.get('product'):
            return {'xml': '<!-- Нет шаблона product -->', 'products_count': 0, 'generation_time': 0}

        # Get products
        products_qs = self._get_products_queryset(product_id)

        # Preload all marketplace attributes for these products
        product_ids = list(products_qs.values_list('id', flat=True))
        attrs_by_product = self._preload_attributes(product_ids)
        configs_by_product = self._preload_configs(product_ids)

        # Render products
        products_xml_parts = []
        products_count = 0

        for product in products_qs.iterator():
            try:
                product_xml = self._render_product(
                    product, templates, attrs_by_product, configs_by_product
                )
                if product_xml:
                    products_xml_parts.append(product_xml)
                    products_count += 1
            except Exception as e:
                logger.error(f'Feed render error for product {product.id}: {e}')

        products_xml = '\n'.join(products_xml_parts)

        # Render header + footer
        header_xml = ''
        if templates.get('header'):
            header_ctx = {
                'shop_name': 'MOAMI',
                'shop_url': SITE_URL,
                'company_name': 'MOAMI Store',
                'time': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'products_count': products_count,
                'products_xml': products_xml,
            }
            header_xml = self._render_template(templates['header'], header_ctx)

        footer_xml = ''
        if templates.get('footer'):
            footer_xml = self._render_template(templates['footer'], {})

        # Combine
        if header_xml and '{{ products_xml' in templates.get('header', ''):
            # Header template already includes products_xml
            full_xml = header_xml + footer_xml
        else:
            full_xml = header_xml + products_xml + footer_xml

        full_xml = sanitize_xml(full_xml)

        return {
            'xml': full_xml,
            'products_count': products_count,
            'generation_time': round(time_module.time() - start, 2),
        }

    def _load_templates(self) -> Dict[str, str]:
        return {
            t.template_type: t.content
            for t in FeedTemplate.objects.filter(marketplace=self.marketplace, is_active=True)
        }

    def _get_products_queryset(self, product_id=None):
        qs = Product.objects.select_related(
            'category', 'brand', 'country'
        ).prefetch_related(
            'variants__color',
            'variants__images',
            'variants__sizes__size__interpretations__grid',
            'compositions__composition',
            'attributes__attribute_group',
            'attributes__value_single_attribute',
            'attributes__value_multi_attributes',
        )

        if product_id:
            return qs.filter(id=product_id)

        # Only products with category mapped to this marketplace
        mapped_category_ids = list(self.category_map.keys())
        return qs.filter(category_id__in=mapped_category_ids)

    def _preload_attributes(self, product_ids: List[int]) -> Dict:
        """Preload all ProductMarketplaceAttribute for products"""
        attrs = ProductMarketplaceAttribute.objects.filter(
            product_id__in=product_ids,
            marketplace_attribute__attribute_set__marketplace=self.marketplace,
        ).select_related(
            'marketplace_attribute', 'value_option', 'variant', 'variant_size',
        ).prefetch_related('value_options')

        result = {}  # product_id → {(variant_id, variant_size_id) → [attr, ...]}
        for a in attrs:
            key = (a.variant_id, a.variant_size_id)
            result.setdefault(a.product_id, {}).setdefault(key, []).append(a)
        return result

    def _preload_configs(self, product_ids: List[int]) -> Dict:
        configs = ProductMarketplaceConfig.objects.filter(
            product_id__in=product_ids,
            marketplace=self.marketplace,
        )
        return {c.product_id: c for c in configs}

    def _render_product(self, product, templates, attrs_by_product, configs_by_product):
        """Build context and render product template"""
        config = configs_by_product.get(product.id)
        cm = self.category_map.get(product.category_id)
        if not cm:
            return None

        product_attrs = attrs_by_product.get(product.id, {})

        # Build product-level attributes dict {external_code: {value, name, code}}
        mp_attrs = self._build_attrs_dict(product_attrs.get((None, None), []))

        # Compositions
        comp_parts_ru = []
        comp_parts_uk = []
        for pc in product.compositions.all():
            comp_parts_ru.append(f"{pc.composition.name} {pc.value}%")
            try:
                uk_name = pc.composition.translations.get(language_code='uk').name
            except Exception:
                uk_name = pc.composition.name
            comp_parts_uk.append(f"{uk_name} {pc.value}%")

        # Brand/Country mapped
        brand_mapped = self.brand_map.get(product.brand_id)
        country_mapped = self.country_map.get(product.country_id)

        # Our attributes
        our_attrs = []
        for pa in product.attributes.all():
            val = pa.get_attribute_string_value('ru')
            val_uk = pa.get_attribute_string_value('uk')
            if val:
                our_attrs.append({
                    'name': pa.attribute_group.name,
                    'name_uk': getattr(pa.attribute_group, 'get_translation__name__uk', pa.attribute_group.name),
                    'value': val,
                    'value_uk': val_uk or val,
                })

        # Build variants
        variants_ctx = []
        for variant in product.variants.all():
            color_mapped = self.color_map.get(variant.color_id) if variant.color else None

            # Variant-level attributes
            v_attrs = self._build_attrs_dict(product_attrs.get((variant.id, None), []))

            # Images (excluding marketplace-excluded)
            images = []
            for img in variant.images.all():
                if img.exclude_at_marketplace:
                    continue
                if img.image:
                    images.append({
                        'url': f'{SITE_URL}/media/{img.image.name}',
                        'image': f'/media/{img.image.name}',
                    })

            # Sizes
            sizes_ctx = []
            for vs in variant.sizes.all():
                size_mapped = self.size_map.get(vs.size_id) if vs.size else None
                interps = vs.size.get_interpretations_dict() if vs.size else {}

                # Size-level attributes
                s_attrs = self._build_attrs_dict(product_attrs.get((variant.id, vs.id), []))

                sizes_ctx.append({
                    'id': vs.id,
                    'size': str(vs.size) if vs.size else '',
                    'size_name': vs.get_size if hasattr(vs, 'get_size') else str(vs.size),
                    'max_size': vs.get_max_size if hasattr(vs, 'get_max_size') else '',
                    'stock': vs.stock,
                    'sku': vs.sku,
                    'mk_sku': vs.mk_sku,
                    'interpretations': interps,
                    'size_mapped': {
                        'external_id': size_mapped.external_id,
                        'name': size_mapped.name,
                    } if size_mapped else None,
                    'attrs': s_attrs,
                    # Convenience: full_id for epicentr-style
                    'full_id': f'{variant.code}-{vs.get_size}'.upper() if hasattr(vs, 'get_size') else '',
                    'mk_full_id': vs.mk_sku,
                })

            try:
                color_name = variant.color.name if variant.color else ''
                color_name_uk = ''
                try:
                    color_name_uk = variant.color.translations.get(language_code='uk').name
                except Exception:
                    color_name_uk = color_name
            except Exception:
                color_name = ''
                color_name_uk = ''

            variants_ctx.append({
                'id': variant.id,
                'code': variant.code,
                'slug': variant.slug,
                'color': color_name,
                'color_uk': color_name_uk,
                'color_mapped': {
                    'external_id': color_mapped.external_id,
                    'name': color_mapped.name,
                } if color_mapped else None,
                'images': images,
                'sizes': sizes_ctx,
                'attrs': v_attrs,
            })

        # Product name (custom or default)
        name = config.custom_name if config and config.custom_name else product.name
        name_uk = config.custom_name_uk if config and config.custom_name_uk else ''
        if not name_uk:
            try:
                name_uk = product.translations.get(language_code='uk').name
            except Exception:
                name_uk = name

        description = config.custom_description if config and config.custom_description else (product.description or '')
        description_uk = config.custom_description_uk if config and config.custom_description_uk else ''
        if not description_uk:
            try:
                description_uk = product.translations.get(language_code='uk').description
            except Exception:
                description_uk = description

        # Country
        country_name = product.country.name if product.country else ''
        country_name_uk = ''
        if product.country:
            try:
                country_name_uk = product.country.translations.get(language_code='uk').name
            except Exception:
                country_name_uk = country_name

        product_ctx = {
            'id': product.id,
            'name': name,
            'name_uk': name_uk,
            'slug': product.slug,
            'code': product.code or '',
            'price': product.price,
            'promo_price': product.promo_price,
            'old_price': product.old_price,
            'description': description,
            'description_uk': description_uk,
            'brand': product.brand.name if product.brand else '',
            'brand_mapped': {
                'external_id': brand_mapped.external_id,
                'name': brand_mapped.name,
            } if brand_mapped else None,
            'country': country_name,
            'country_uk': country_name_uk,
            'country_mapped': {
                'external_id': country_mapped.external_id,
                'name': country_mapped.name,
            } if country_mapped else None,
            'category': {
                'id': product.category_id,
                'name': product.category.name if product.category else '',
                'mp_category': {
                    'id': cm.marketplace_category_id,
                    'name': cm.marketplace_category.name,
                    'code': cm.marketplace_category.external_code,
                    'external_id': cm.marketplace_category.external_id,
                } if cm else None,
            },
            'composition': ', '.join(comp_parts_ru),
            'composition_uk': ', '.join(comp_parts_uk),
            'compositions': [
                {'name': p.split(' ')[0], 'value': p.split(' ')[-1]}
                for p in comp_parts_ru
            ],
            'url': f'{SITE_URL}/product/{product.slug}/',
            'variants': variants_ctx,
            'attributes': our_attrs,
            'attrs': mp_attrs,
        }

        # Render variant template if exists, inject as variants_xml
        if templates.get('variant'):
            variant_parts = []
            for v in variants_ctx:
                for s in v['sizes']:
                    ctx = {'product': product_ctx, 'variant': v, 'size': s}
                    variant_parts.append(self._render_template(templates['variant'], ctx))
            product_ctx['variants_xml'] = '\n'.join(variant_parts)

        return self._render_template(templates['product'], {'product': product_ctx})

    def _build_attrs_dict(self, attrs_list) -> Dict:
        """Convert list of ProductMarketplaceAttribute to dict keyed by external_code"""
        result = {}
        for pma in attrs_list:
            code = pma.marketplace_attribute.external_code
            attr_name = pma.marketplace_attribute.name
            value_ru = pma.get_value_for_xml('ru')
            value_uk = pma.get_value_for_xml('uk')
            result[code] = {
                'name': attr_name,
                'value': value_ru,
                'value_uk': value_uk,
                'code': code,
            }
        return result

    def _render_template(self, template_content: str, context: dict) -> str:
        try:
            template = Template(template_content)
            return template.render(Context(context))
        except Exception as e:
            return f'<!-- Ошибка: {str(e)} -->'


def sanitize_xml(xml_string: str) -> str:
    """Remove invalid XML characters and fix common issues"""
    # Remove control characters except tab, newline, carriage return
    xml_string = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', xml_string)
    # Fix unescaped ampersands
    xml_string = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)', '&amp;', xml_string)
    return xml_string


# Template variables reference for UI
TEMPLATE_VARIABLES = {
    'header': {
        'shop_name': 'Название магазина (MOAMI)',
        'shop_url': 'URL магазина',
        'company_name': 'Название компании',
        'time': 'Дата/время генерации',
        'products_count': 'Количество товаров',
        'products_xml': 'XML всех товаров (если header содержит offers)',
    },
    'product': {
        'product.id': 'ID товара',
        'product.name': 'Название (рус)',
        'product.name_uk': 'Название (укр)',
        'product.code': 'Код товара',
        'product.slug': 'Slug',
        'product.price': 'Цена',
        'product.promo_price': 'Акционная цена',
        'product.old_price': 'Старая цена',
        'product.description': 'Описание (рус)',
        'product.description_uk': 'Описание (укр)',
        'product.brand': 'Бренд',
        'product.brand_mapped.name': 'Бренд маркетплейса',
        'product.brand_mapped.external_id': 'ID бренда маркетплейса',
        'product.country': 'Страна (рус)',
        'product.country_uk': 'Страна (укр)',
        'product.country_mapped.name': 'Страна маркетплейса',
        'product.composition': 'Состав (рус)',
        'product.composition_uk': 'Состав (укр)',
        'product.url': 'URL товара',
        'product.category.name': 'Категория',
        'product.category.mp_category.name': 'Категория МП',
        'product.category.mp_category.code': 'Код категории МП',
        'product.attrs.<code>.value': 'Атрибут МП по коду (рус)',
        'product.attrs.<code>.value_uk': 'Атрибут МП по коду (укр)',
        'product.variants': 'Список вариантов (for variant in product.variants)',
        'product.variants_xml': 'XML вариантов (если есть variant шаблон)',
        'product.attributes': 'Наши атрибуты [{name, value, value_uk}]',
    },
    'variant': {
        'product.*': 'Все поля товара (см. product)',
        'variant.code': 'Код варианта',
        'variant.color': 'Цвет (рус)',
        'variant.color_uk': 'Цвет (укр)',
        'variant.color_mapped.name': 'Цвет маркетплейса',
        'variant.images': 'Список изображений [{url, image}]',
        'variant.attrs.<code>.value': 'Атрибут варианта МП',
        'variant.sizes': 'Список размеров',
        'size.size': 'Размер (все сетки)',
        'size.size_name': 'Размер (предпочтительная сетка)',
        'size.max_size': 'Макс. размер',
        'size.stock': 'Остаток',
        'size.sku': 'SKU',
        'size.mk_sku': 'SKU для МК',
        'size.mk_full_id': 'Full ID (код-размер)',
        'size.interpretations': 'Размерные сетки {ua: "42", eu: "36", int: "S"}',
        'size.size_mapped.name': 'Размер маркетплейса',
        'size.attrs.<code>.value': 'Атрибут размера МП',
    },
    'footer': {
        '(пустой контекст)': 'Обычно просто закрывающие теги',
    },
}
