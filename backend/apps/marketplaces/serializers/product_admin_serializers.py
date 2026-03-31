from rest_framework import serializers
from apps.product.models import (
    Product, Variant, VariantSize, VariantImage,
    ProductComposition, ProductAttribute,
)
from apps.marketplaces.models import (
    Marketplace,
    CategoryMapping,
    MarketplaceAttributeLevel,
    MarketplaceAttributeSet,
    ProductMarketplaceAttribute,
    ProductMarketplaceConfig,
    BrandMapping,
)


class VariantImageAdminSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = VariantImage
        fields = ['id', 'index', 'exclude_at_marketplace', 'url', 'thumbnail']

    def get_url(self, obj):
        if obj.image:
            from django.conf import settings
            return f'{settings.MEDIA_URL}{obj.image.name}'
        return None

    def get_thumbnail(self, obj):
        thumb = obj.thumbnails.get('m') or obj.thumbnails.get('s')
        if thumb:
            from django.conf import settings
            return f'{settings.MEDIA_URL}{thumb}'
        return self.get_url(obj)


class VariantSizeAdminSerializer(serializers.ModelSerializer):
    size_name = serializers.SerializerMethodField()
    max_size_name = serializers.SerializerMethodField()
    sku = serializers.CharField(read_only=True)

    class Meta:
        model = VariantSize
        fields = ['id', 'size', 'size_name', 'max_size', 'max_size_name', 'stock', 'sku']

    def get_size_name(self, obj):
        return str(obj.size) if obj.size else ''

    def get_max_size_name(self, obj):
        return str(obj.max_size) if obj.max_size else ''


class VariantAdminSerializer(serializers.ModelSerializer):
    color_name = serializers.CharField(source='color.name', read_only=True)
    color_code = serializers.CharField(source='color.code', read_only=True)
    first_image = serializers.SerializerMethodField()
    images = VariantImageAdminSerializer(many=True, read_only=True)
    sizes = VariantSizeAdminSerializer(many=True, read_only=True)

    class Meta:
        model = Variant
        fields = ['id', 'code', 'color', 'color_name', 'color_code', 'first_image', 'images', 'sizes']

    def get_first_image(self, obj):
        image = obj.images.first()
        if image:
            thumb = image.thumbnails.get('m') or image.thumbnails.get('s')
            if thumb:
                from django.conf import settings
                return f'{settings.MEDIA_URL}{thumb}'
            if image.image:
                return image.image.url
        return None


class ProductListAdminSerializer(serializers.ModelSerializer):
    """Список товаров для новой админки"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.SerializerMethodField()
    variants_count = serializers.SerializerMethodField()
    first_image = serializers.SerializerMethodField()
    marketplace_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name',
            'brand_name', 'price', 'promo_price',
            'variants_count', 'first_image', 'marketplace_status',
        ]

    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None

    def get_variants_count(self, obj):
        return obj.variants.count()

    def get_first_image(self, obj):
        variant = obj.variants.first()
        if variant:
            image = variant.images.first()
            if image:
                thumb = image.thumbnails.get('s') or image.thumbnails.get('xs')
                if thumb:
                    from django.conf import settings
                    return f'{settings.MEDIA_URL}{thumb}'
                if image.image:
                    return image.image.url
        return None

    def get_marketplace_status(self, obj):
        """Краткий статус по каждому активному маркетплейсу"""
        result = {}
        for mp in Marketplace.objects.filter(is_active=True):
            # Проверяем есть ли маппинг категории
            cm = CategoryMapping.objects.filter(
                category=obj.category,
                marketplace_category__marketplace=mp,
                is_active=True,
            ).first()

            if not cm:
                result[mp.slug] = {'status': 'no_mapping', 'name': mp.name}
                continue

            # Считаем заполненные required атрибуты
            configured = MarketplaceAttributeLevel.objects.filter(
                category_mapping=cm
            ).exclude(level='skip')

            required_count = configured.filter(
                marketplace_attribute__is_required=True
            ).count()

            filled_count = ProductMarketplaceAttribute.objects.filter(
                product=obj,
                marketplace_attribute__in=configured.values_list('marketplace_attribute', flat=True),
                marketplace_attribute__is_required=True,
                variant__isnull=True,
                variant_size__isnull=True,
            ).count()

            if required_count == 0:
                status = 'not_configured'
            elif filled_count >= required_count:
                status = 'ready'
            elif filled_count > 0:
                status = 'partial'
            else:
                status = 'empty'

            result[mp.slug] = {
                'name': mp.name,
                'status': status,
                'filled': filled_count,
                'required': required_count,
            }

        return result


class ProductCompositionSerializer(serializers.ModelSerializer):
    composition_name = serializers.CharField(source='composition.name', read_only=True)

    class Meta:
        model = ProductComposition
        fields = ['id', 'composition', 'composition_name', 'value']


class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_group_name = serializers.CharField(source='attribute_group.name', read_only=True)
    data_type = serializers.CharField(source='attribute_group.data_type', read_only=True)
    value_single_attribute_name = serializers.SerializerMethodField()
    value_multi_attributes_list = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttribute
        fields = [
            'id', 'attribute_group', 'attribute_group_name', 'data_type',
            'value_single_attribute', 'value_single_attribute_name',
            'value_multi_attributes', 'value_multi_attributes_list',
            'value_int', 'value_str',
        ]

    def get_value_single_attribute_name(self, obj):
        return obj.value_single_attribute.name if obj.value_single_attribute else None

    def get_value_multi_attributes_list(self, obj):
        return [{'id': a.id, 'name': a.name} for a in obj.value_multi_attributes.all()]


class ProductDetailAdminSerializer(serializers.ModelSerializer):
    """Детали товара"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_size_group = serializers.IntegerField(source='category.size_group_id', read_only=True)
    brand_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    variants = VariantAdminSerializer(many=True, read_only=True)
    compositions = ProductCompositionSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    extra_description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'category_size_group',
            'brand', 'brand_name', 'country', 'country_name',
            'code', 'price', 'promo_price', 'old_price',
            'description', 'extra_description', 'variants',
            'compositions', 'attributes',
        ]

    def get_brand_name(self, obj):
        return obj.brand.name if obj.brand else None

    def get_country_name(self, obj):
        return obj.country.name if obj.country else None


class SaveAttributesSerializer(serializers.Serializer):
    """Сохранение заполненных атрибутов товара для маркетплейса"""
    marketplace_id = serializers.IntegerField()
    product_attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
    variant_attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
    size_attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )

    def save_for_product(self, product):
        marketplace_id = self.validated_data['marketplace_id']
        saved = 0

        # Убедиться что config существует
        ProductMarketplaceConfig.objects.get_or_create(
            product=product,
            marketplace_id=marketplace_id,
            defaults={'is_active': True}
        )

        # Product-level attributes
        for attr_data in self.validated_data.get('product_attributes', []):
            saved += self._save_attribute(
                product=product,
                attr_data=attr_data,
                variant=None,
                variant_size=None,
            )

        # Variant-level attributes
        for attr_data in self.validated_data.get('variant_attributes', []):
            variant_id = attr_data.get('variant_id')
            if not variant_id:
                continue
            saved += self._save_attribute(
                product=product,
                attr_data=attr_data,
                variant_id=variant_id,
                variant_size=None,
            )

        # Size-level attributes
        # Cache variant_id lookups from variant_size_id
        vs_variant_cache = {}
        for attr_data in self.validated_data.get('size_attributes', []):
            variant_size_id = attr_data.get('variant_size_id')
            if not variant_size_id:
                continue
            variant_id = attr_data.get('variant_id')
            # Resolve variant_id from variant_size if not provided
            if not variant_id:
                if variant_size_id not in vs_variant_cache:
                    from apps.product.models import VariantSize
                    try:
                        vs_variant_cache[variant_size_id] = VariantSize.objects.get(
                            id=variant_size_id
                        ).variant_id
                    except VariantSize.DoesNotExist:
                        vs_variant_cache[variant_size_id] = None
                variant_id = vs_variant_cache[variant_size_id]
            saved += self._save_attribute(
                product=product,
                attr_data=attr_data,
                variant_id=variant_id,
                variant_size_id=variant_size_id,
            )

        return saved

    def _save_attribute(self, product, attr_data, variant=None, variant_id=None,
                        variant_size=None, variant_size_id=None):
        from apps.marketplaces.models import MarketplaceAttributeOption

        mp_attr_id = attr_data.get('mp_attribute_id')
        if not mp_attr_id:
            return 0

        # Auto-detect: if value_int sent for a select attr, treat as value_option
        from apps.marketplaces.models import MarketplaceAttribute
        try:
            mp_attr = MarketplaceAttribute.objects.get(id=mp_attr_id)
            attr_type = mp_attr.attr_type
        except MarketplaceAttribute.DoesNotExist:
            attr_type = None

        if attr_type == 'select' and 'value_int' in attr_data and 'value_option' not in attr_data:
            attr_data['value_option'] = attr_data.pop('value_int')
        if attr_type == 'multiselect' and 'value_int' in attr_data and 'value_options' not in attr_data:
            attr_data['value_options'] = [attr_data.pop('value_int')]
        if attr_type in ('int', 'float') and 'value_option' in attr_data and 'value_int' not in attr_data:
            attr_data['value_int'] = attr_data.pop('value_option')
        if attr_type == 'float' and 'value_int' in attr_data and 'value_float' not in attr_data:
            attr_data['value_float'] = attr_data.pop('value_int')

        defaults = {}

        # Значения по типу
        if 'value_option' in attr_data and attr_data['value_option'] is not None:
            opt_id = attr_data['value_option']
            # Validate option exists
            if MarketplaceAttributeOption.objects.filter(id=opt_id).exists():
                defaults['value_option_id'] = opt_id
        if 'value_string' in attr_data:
            defaults['value_string'] = attr_data['value_string'] or ''
        if 'value_string_uk' in attr_data:
            defaults['value_string_uk'] = attr_data['value_string_uk'] or ''
        if 'value_text' in attr_data:
            defaults['value_text'] = attr_data['value_text'] or ''
        if 'value_text_uk' in attr_data:
            defaults['value_text_uk'] = attr_data['value_text_uk'] or ''
        if 'value_int' in attr_data and attr_data['value_int'] is not None:
            defaults['value_int'] = attr_data['value_int']
        if 'value_float' in attr_data and attr_data['value_float'] is not None:
            defaults['value_float'] = attr_data['value_float']
        if 'value_boolean' in attr_data and attr_data['value_boolean'] is not None:
            defaults['value_boolean'] = attr_data['value_boolean']

        lookup = {
            'product': product,
            'marketplace_attribute_id': mp_attr_id,
            'variant_id': variant_id,
            'variant_size_id': variant_size_id,
        }

        obj, _ = ProductMarketplaceAttribute.objects.update_or_create(
            **lookup,
            defaults=defaults,
        )

        # M2M для multiselect — validate option IDs exist
        if 'value_options' in attr_data:
            opt_ids = attr_data['value_options'] or []
            if opt_ids:
                valid_ids = list(MarketplaceAttributeOption.objects.filter(
                    id__in=opt_ids
                ).values_list('id', flat=True))
                obj.value_options.set(valid_ids)
            else:
                obj.value_options.clear()

        return 1


class ProductSaveAllSerializer(serializers.Serializer):
    """
    Save all product data in one request:
    - product fields (name, code, category, brand, country, prices, description)
    - compositions [{composition_id, value}]
    - our_attributes [{attribute_group_id, value_single_attribute, value_multi_attributes, value_int, value_str}]
    - variants: [{id (if existing), code, color_id, deleted, sizes: [...], image_order: [...]}]
    - deleted_variant_ids: [id]
    - deleted_size_ids: [id]
    - deleted_image_ids: [id]
    - image_reorders: [{variant_id, image_ids: [ordered]}]
    """
    # Product fields
    name = serializers.CharField(required=False)
    code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.IntegerField(required=False)
    brand = serializers.IntegerField(required=False)
    country = serializers.IntegerField(required=False)
    price = serializers.IntegerField(required=False)
    promo_price = serializers.IntegerField(required=False)
    old_price = serializers.IntegerField(required=False)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    extra_description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # Compositions
    compositions = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    # Our attributes
    our_attributes = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    # Variants
    variants = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    # Deletions
    deleted_variant_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    deleted_size_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    deleted_image_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    # Image reorders
    image_reorders = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )

    def save_for_product(self, product):
        data = self.validated_data

        # 1. Update product fields
        product_fields = ['name', 'code', 'price', 'promo_price', 'old_price',
                          'description', 'extra_description']
        updated = False
        for field in product_fields:
            if field in data:
                setattr(product, field, data[field])
                updated = True
        if 'category' in data:
            product.category_id = data['category']
            updated = True
        if 'brand' in data:
            product.brand_id = data['brand']
            updated = True
        if 'country' in data:
            product.country_id = data['country']
            updated = True
        if updated:
            product.save()

        # 2. Save compositions (replace all)
        if 'compositions' in data and data['compositions'] is not None:
            ProductComposition.objects.filter(product=product).delete()
            for comp in data['compositions']:
                if comp.get('composition_id') and comp.get('value'):
                    ProductComposition.objects.create(
                        product=product,
                        composition_id=comp['composition_id'],
                        value=comp['value'],
                    )

        # 3. Save our attributes (replace all)
        if 'our_attributes' in data and data['our_attributes'] is not None:
            ProductAttribute.objects.filter(product=product).delete()
            for attr in data['our_attributes']:
                ag_id = attr.get('attribute_group_id')
                if not ag_id:
                    continue
                pa = ProductAttribute.objects.create(
                    product=product,
                    attribute_group_id=ag_id,
                    value_single_attribute_id=attr.get('value_single_attribute') or None,
                    value_int=attr.get('value_int'),
                    value_str=attr.get('value_str'),
                )
                multi = attr.get('value_multi_attributes')
                if multi:
                    pa.value_multi_attributes.set(multi)

        # 4. Delete variants
        for vid in data.get('deleted_variant_ids', []):
            Variant.objects.filter(id=vid, product=product).delete()

        # 5. Delete sizes
        for sid in data.get('deleted_size_ids', []):
            VariantSize.objects.filter(id=sid, variant__product=product).delete()

        # 6. Delete images
        for iid in data.get('deleted_image_ids', []):
            VariantImage.objects.filter(id=iid, variant__product=product).delete()

        # 7. Update/create variants
        for v_data in data.get('variants', []):
            v_id = v_data.get('id')
            if v_id:
                # Update existing variant
                try:
                    variant = Variant.objects.get(id=v_id, product=product)
                    if 'code' in v_data:
                        variant.code = v_data['code']
                    if 'color_id' in v_data:
                        variant.color_id = v_data['color_id']
                    variant.slug = variant.get_slug
                    variant.save()
                except Variant.DoesNotExist:
                    continue
            else:
                # Create new variant
                code = v_data.get('code', '')
                color_id = v_data.get('color_id')
                if code and color_id:
                    variant = Variant(
                        product=product,
                        code=code,
                        color_id=color_id,
                    )
                    variant.slug = variant.get_slug
                    variant.save()
                    v_data['id'] = variant.id
                else:
                    continue

            # Update/create sizes for this variant
            for s_data in v_data.get('sizes', []):
                s_id = s_data.get('id')
                if s_id:
                    try:
                        vs = VariantSize.objects.get(id=s_id, variant=variant)
                        if 'stock' in s_data:
                            vs.stock = s_data['stock']
                        if 'size_id' in s_data:
                            vs.size_id = s_data['size_id']
                        if 'max_size_id' in s_data:
                            vs.max_size_id = s_data['max_size_id'] or None
                        vs.save()
                    except VariantSize.DoesNotExist:
                        continue
                else:
                    size_id = s_data.get('size_id')
                    if size_id:
                        VariantSize.objects.create(
                            variant=variant,
                            size_id=size_id,
                            max_size_id=s_data.get('max_size_id') or None,
                            stock=s_data.get('stock', 1),
                        )

        # 8. Image reorders
        for reorder in data.get('image_reorders', []):
            variant_id = reorder.get('variant_id')
            image_ids = reorder.get('image_ids', [])
            for idx, img_id in enumerate(image_ids):
                VariantImage.objects.filter(
                    id=img_id, variant_id=variant_id
                ).update(index=idx)

        return product
