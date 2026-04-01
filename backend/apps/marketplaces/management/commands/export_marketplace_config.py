"""
Export marketplace configuration to JSON backup.

Exports: marketplaces, categories, category mappings, attribute sets,
attributes, options, attribute levels, entity mappings, feed templates, pipelines.

Usage:
  python manage.py export_marketplace_config                    # all marketplaces
  python manage.py export_marketplace_config --marketplace 3    # specific marketplace
  python manage.py export_marketplace_config --output /path/to/backup.json
"""
import json
from datetime import datetime
from django.core.management.base import BaseCommand

from apps.marketplaces.models import (
    Marketplace,
    MarketplaceCategory,
    CategoryMapping,
    MarketplaceAttributeSet,
    MarketplaceAttribute,
    MarketplaceAttributeOption,
    MarketplaceAttributeLevel,
    AttributeMapping,
    MarketplaceEntity,
    BrandMapping,
    ColorMapping,
    CountryMapping,
    SizeMapping,
    FeedTemplate,
    MarketplacePipeline,
    PipelineStep,
)


class Command(BaseCommand):
    help = 'Export marketplace configuration to JSON'

    def add_arguments(self, parser):
        parser.add_argument('--marketplace', type=int, help='Marketplace ID (all if not specified)')
        parser.add_argument('--output', type=str, help='Output file path')

    def handle(self, *args, **options):
        mp_id = options.get('marketplace')
        marketplaces = Marketplace.objects.all()
        if mp_id:
            marketplaces = marketplaces.filter(id=mp_id)

        data = {
            'exported_at': datetime.now().isoformat(),
            'marketplaces': [],
        }

        for mp in marketplaces:
            self.stdout.write(f'Exporting {mp.name}...')
            mp_data = self._export_marketplace(mp)
            data['marketplaces'].append(mp_data)

        output = options.get('output') or f'marketplace_config_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(output, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

        total_cats = sum(len(m['categories']) for m in data['marketplaces'])
        total_attrs = sum(
            sum(len(s['attributes']) for s in m['attribute_sets'])
            for m in data['marketplaces']
        )
        self.stdout.write(self.style.SUCCESS(
            f'Exported {len(data["marketplaces"])} marketplaces, '
            f'{total_cats} categories, {total_attrs} attributes → {output}'
        ))

    def _export_marketplace(self, mp):
        # Categories
        categories = []
        for cat in MarketplaceCategory.objects.filter(marketplace=mp):
            categories.append({
                'id': cat.id,
                'external_id': cat.external_id,
                'external_code': cat.external_code,
                'name': cat.name,
                'name_uk': cat.name_uk,
                'parent_id': cat.parent_id,
            })

        # Category mappings
        cat_mappings = []
        for cm in CategoryMapping.objects.filter(
            marketplace_category__marketplace=mp
        ).select_related('category', 'marketplace_category'):
            cat_mappings.append({
                'id': cm.id,
                'category_id': cm.category_id,
                'category_name': cm.category.name if cm.category else '',
                'marketplace_category_id': cm.marketplace_category_id,
                'marketplace_category_code': cm.marketplace_category.external_code,
                'is_active': cm.is_active,
            })

        # Attribute sets with attributes and options
        attr_sets = []
        for aset in MarketplaceAttributeSet.objects.filter(marketplace=mp):
            attrs = []
            for attr in aset.attributes.all():
                options = []
                for opt in attr.options.all():
                    options.append({
                        'id': opt.id,
                        'external_code': opt.external_code,
                        'name': opt.name,
                        'name_uk': opt.name_uk,
                    })
                attrs.append({
                    'id': attr.id,
                    'external_code': attr.external_code,
                    'name': attr.name,
                    'name_uk': attr.name_uk,
                    'attr_type': attr.attr_type,
                    'is_required': attr.is_required,
                    'is_system': attr.is_system,
                    'group_name': attr.group_name,
                    'suffix': attr.suffix,
                    'options': options,
                })
            attr_sets.append({
                'id': aset.id,
                'external_code': aset.external_code,
                'name': aset.name,
                'name_uk': aset.name_uk,
                'marketplace_category_id': aset.marketplace_category_id,
                'attributes': attrs,
            })

        # Attribute levels
        attr_levels = []
        for al in MarketplaceAttributeLevel.objects.filter(
            category_mapping__marketplace_category__marketplace=mp
        ).select_related('marketplace_attribute', 'category_mapping'):
            attr_levels.append({
                'category_mapping_id': al.category_mapping_id,
                'marketplace_attribute_id': al.marketplace_attribute_id,
                'marketplace_attribute_code': al.marketplace_attribute.external_code,
                'level': al.level,
            })

        # Attribute mappings
        attr_mappings = []
        for am in AttributeMapping.objects.filter(
            marketplace_attribute__attribute_set__marketplace=mp
        ).select_related('our_attribute', 'marketplace_attribute', 'marketplace_option'):
            attr_mappings.append({
                'our_attribute_id': am.our_attribute_id,
                'our_attribute_name': am.our_attribute.name if am.our_attribute else '',
                'marketplace_attribute_id': am.marketplace_attribute_id,
                'marketplace_attribute_code': am.marketplace_attribute.external_code,
                'marketplace_option_id': am.marketplace_option_id,
            })

        # Entity mappings
        entities = []
        for e in MarketplaceEntity.objects.filter(marketplace=mp):
            entities.append({
                'id': e.id,
                'entity_type': e.entity_type,
                'external_id': e.external_id,
                'external_code': e.external_code,
                'name': e.name,
                'name_uk': e.name_uk,
            })

        brand_maps = [
            {'brand_id': bm.brand_id, 'entity_id': bm.marketplace_entity_id}
            for bm in BrandMapping.objects.filter(marketplace_entity__marketplace=mp)
        ]
        color_maps = [
            {'color_id': cm.color_id, 'entity_id': cm.marketplace_entity_id}
            for cm in ColorMapping.objects.filter(marketplace_entity__marketplace=mp)
        ]
        country_maps = [
            {'country_id': cm.country_id, 'entity_id': cm.marketplace_entity_id}
            for cm in CountryMapping.objects.filter(marketplace_entity__marketplace=mp)
        ]
        size_maps = [
            {'size_id': sm.size_id, 'entity_id': sm.marketplace_entity_id}
            for sm in SizeMapping.objects.filter(marketplace_entity__marketplace=mp)
        ]

        # Feed templates
        templates = []
        for t in FeedTemplate.objects.filter(marketplace=mp):
            templates.append({
                'id': t.id,
                'template_type': t.template_type,
                'name': t.name,
                'content': t.content,
                'is_active': t.is_active,
            })

        # Pipelines
        pipelines = []
        for p in MarketplacePipeline.objects.filter(marketplace=mp):
            steps = []
            for s in p.steps.all().order_by('order'):
                steps.append({
                    'order': s.order,
                    'name': s.name,
                    'step_type': s.step_type,
                    'config': s.config,
                    'is_active': s.is_active,
                })
            pipelines.append({
                'id': p.id,
                'name': p.name,
                'purpose': p.purpose,
                'steps': steps,
            })

        return {
            'id': mp.id,
            'name': mp.name,
            'slug': mp.slug,
            'is_active': mp.is_active,
            'api_config': mp.api_config,
            'feed_filename': mp.feed_filename,
            'categories': categories,
            'category_mappings': cat_mappings,
            'attribute_sets': attr_sets,
            'attribute_levels': attr_levels,
            'attribute_mappings': attr_mappings,
            'entities': entities,
            'brand_mappings': brand_maps,
            'color_mappings': color_maps,
            'country_mappings': country_maps,
            'size_mappings': size_maps,
            'feed_templates': templates,
            'pipelines': pipelines,
        }
