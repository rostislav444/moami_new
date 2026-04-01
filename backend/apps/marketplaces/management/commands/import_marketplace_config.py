"""
Import marketplace configuration from JSON backup.

Usage:
  python manage.py import_marketplace_config marketplace_config_20260401.json
  python manage.py import_marketplace_config backup.json --marketplace 3  # only specific MP
"""
import json
from django.core.management.base import BaseCommand
from django.db import transaction

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
    help = 'Import marketplace configuration from JSON backup'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='JSON backup file path')
        parser.add_argument('--marketplace', type=int, help='Import only specific marketplace ID')

    def handle(self, *args, **options):
        filepath = options['file']
        mp_filter = options.get('marketplace')

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.stdout.write(f'Backup from: {data.get("exported_at", "unknown")}')

        for mp_data in data['marketplaces']:
            if mp_filter and mp_data['id'] != mp_filter:
                continue
            self._import_marketplace(mp_data)

        self.stdout.write(self.style.SUCCESS('Import complete'))

    @transaction.atomic
    def _import_marketplace(self, mp_data):
        mp_name = mp_data['name']
        self.stdout.write(f'\nImporting {mp_name}...')

        # Marketplace
        mp, _ = Marketplace.objects.update_or_create(
            id=mp_data['id'],
            defaults={
                'name': mp_data['name'],
                'slug': mp_data['slug'],
                'is_active': mp_data['is_active'],
                'api_config': mp_data.get('api_config') or {},
                'feed_filename': mp_data.get('feed_filename', ''),
            },
        )

        # ID maps for cross-references
        cat_id_map = {}  # old_id → new_obj
        entity_id_map = {}
        attr_id_map = {}
        option_id_map = {}
        cm_id_map = {}

        # Categories
        for cat_data in mp_data.get('categories', []):
            cat, _ = MarketplaceCategory.objects.update_or_create(
                id=cat_data['id'],
                defaults={
                    'marketplace': mp,
                    'external_id': cat_data.get('external_id', ''),
                    'external_code': cat_data.get('external_code', ''),
                    'name': cat_data['name'],
                    'name_uk': cat_data.get('name_uk', ''),
                    'parent_id': cat_data.get('parent_id'),
                },
            )
            cat_id_map[cat_data['id']] = cat
        self.stdout.write(f'  Categories: {len(cat_id_map)}')

        # Category mappings
        for cm_data in mp_data.get('category_mappings', []):
            cm, _ = CategoryMapping.objects.update_or_create(
                id=cm_data['id'],
                defaults={
                    'category_id': cm_data['category_id'],
                    'marketplace_category_id': cm_data['marketplace_category_id'],
                    'is_active': cm_data.get('is_active', True),
                },
            )
            cm_id_map[cm_data['id']] = cm
        self.stdout.write(f'  Category mappings: {len(cm_id_map)}')

        # Attribute sets + attributes + options
        total_attrs = 0
        total_opts = 0
        for aset_data in mp_data.get('attribute_sets', []):
            aset, _ = MarketplaceAttributeSet.objects.update_or_create(
                id=aset_data['id'],
                defaults={
                    'marketplace': mp,
                    'external_code': aset_data.get('external_code', ''),
                    'name': aset_data['name'],
                    'name_uk': aset_data.get('name_uk', ''),
                    'marketplace_category_id': aset_data.get('marketplace_category_id'),
                },
            )
            for attr_data in aset_data.get('attributes', []):
                attr, _ = MarketplaceAttribute.objects.update_or_create(
                    id=attr_data['id'],
                    defaults={
                        'attribute_set': aset,
                        'external_code': attr_data.get('external_code', ''),
                        'name': attr_data['name'],
                        'name_uk': attr_data.get('name_uk', ''),
                        'attr_type': attr_data.get('attr_type', 'string'),
                        'is_required': attr_data.get('is_required', False),
                        'is_system': attr_data.get('is_system', False),
                        'group_name': attr_data.get('group_name', ''),
                        'suffix': attr_data.get('suffix', ''),
                    },
                )
                attr_id_map[attr_data['id']] = attr
                total_attrs += 1

                for opt_data in attr_data.get('options', []):
                    opt, _ = MarketplaceAttributeOption.objects.update_or_create(
                        id=opt_data['id'],
                        defaults={
                            'attribute': attr,
                            'external_code': opt_data.get('external_code', ''),
                            'name': opt_data['name'],
                            'name_uk': opt_data.get('name_uk', ''),
                        },
                    )
                    option_id_map[opt_data['id']] = opt
                    total_opts += 1

        self.stdout.write(f'  Attributes: {total_attrs}, Options: {total_opts}')

        # Attribute levels
        count = 0
        for al_data in mp_data.get('attribute_levels', []):
            MarketplaceAttributeLevel.objects.update_or_create(
                category_mapping_id=al_data['category_mapping_id'],
                marketplace_attribute_id=al_data['marketplace_attribute_id'],
                defaults={'level': al_data['level']},
            )
            count += 1
        self.stdout.write(f'  Attribute levels: {count}')

        # Entities
        for e_data in mp_data.get('entities', []):
            entity, _ = MarketplaceEntity.objects.update_or_create(
                id=e_data['id'],
                defaults={
                    'marketplace': mp,
                    'entity_type': e_data['entity_type'],
                    'external_id': e_data.get('external_id', ''),
                    'external_code': e_data.get('external_code', ''),
                    'name': e_data['name'],
                    'name_uk': e_data.get('name_uk', ''),
                },
            )
            entity_id_map[e_data['id']] = entity

        # Entity mappings
        for bm in mp_data.get('brand_mappings', []):
            BrandMapping.objects.update_or_create(
                brand_id=bm['brand_id'],
                marketplace_entity_id=bm['entity_id'],
                defaults={},
            )
        for cm in mp_data.get('color_mappings', []):
            ColorMapping.objects.update_or_create(
                color_id=cm['color_id'],
                marketplace_entity_id=cm['entity_id'],
                defaults={},
            )
        for cm in mp_data.get('country_mappings', []):
            CountryMapping.objects.update_or_create(
                country_id=cm['country_id'],
                marketplace_entity_id=cm['entity_id'],
                defaults={},
            )
        for sm in mp_data.get('size_mappings', []):
            SizeMapping.objects.update_or_create(
                size_id=sm['size_id'],
                marketplace_entity_id=sm['entity_id'],
                defaults={},
            )
        self.stdout.write(f'  Entities: {len(entity_id_map)}')

        # Feed templates
        for t_data in mp_data.get('feed_templates', []):
            FeedTemplate.objects.update_or_create(
                marketplace=mp,
                template_type=t_data['template_type'],
                defaults={
                    'name': t_data['name'],
                    'content': t_data['content'],
                    'is_active': t_data.get('is_active', True),
                },
            )
        self.stdout.write(f'  Feed templates: {len(mp_data.get("feed_templates", []))}')

        # Pipelines
        for p_data in mp_data.get('pipelines', []):
            pipeline, _ = MarketplacePipeline.objects.update_or_create(
                id=p_data['id'],
                defaults={
                    'marketplace': mp,
                    'name': p_data['name'],
                    'purpose': p_data.get('purpose', ''),
                },
            )
            for s_data in p_data.get('steps', []):
                PipelineStep.objects.update_or_create(
                    pipeline=pipeline,
                    order=s_data['order'],
                    defaults={
                        'name': s_data['name'],
                        'step_type': s_data['step_type'],
                        'config': s_data.get('config', {}),
                        'is_active': s_data.get('is_active', True),
                    },
                )
        self.stdout.write(f'  Pipelines: {len(mp_data.get("pipelines", []))}')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {mp_name} imported'))
