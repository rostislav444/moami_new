"""
AI-сервис для автозаполнения атрибутов товара для маркетплейса.
Заполняет ТОЛЬКО product-level атрибуты (brand/color/country/size обрабатываются отдельно).
"""
import json
import logging
from typing import Dict, List, Any

from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


def ai_fill_product_attributes(
    product, marketplace, form_data: Dict,
    with_images: bool = False,
) -> Dict[str, Any]:
    """
    Автозаполнение атрибутов товара для маркетплейса через Claude Sonnet.
    Принимает полные form_data и возвращает иерархическую структуру.
    """
    if not HAS_ANTHROPIC:
        return {'success': False, 'error': 'anthropic package not installed'}

    client = anthropic.Anthropic(
        api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
    )

    product_info = _build_product_context(product)

    # Collect size hints from product — prioritize Ukrainian (ua) sizes
    size_hints = set()
    for v in product.variants.prefetch_related('sizes__size__interpretations__grid').all():
        for vs in v.sizes.all():
            if vs.size:
                interps = vs.size.get_interpretations_dict()
                # Prioritize ua size, fallback to others
                ua_val = interps.get('ua') or interps.get('UA')
                if ua_val:
                    size_hints.add(str(ua_val).strip())
                else:
                    for val in interps.values():
                        size_hints.add(str(val).strip())
    size_hints = list(size_hints)

    # Build hierarchical attribute structure for prompt
    structure_lines = []

    # Product-level
    product_attrs = form_data.get('product_attributes', [])
    if product_attrs:
        structure_lines.append("PRODUCT_ATTRIBUTES (общие для всего товара: пол, сезон, стиль, габариты УПАКОВКИ и т.д.):")
        structure_lines.append(_build_attributes_prompt(product_attrs, size_hints))

    # Variants
    variants = form_data.get('variants', [])
    for v in variants:
        v_attrs = v.get('attributes', [])
        structure_lines.append(f"\nVARIANT id={v['variant_id']} code=\"{v['code']}\" color=\"{v.get('color_name', '')}\":")

        if v_attrs:
            structure_lines.append("  VARIANT_ATTRIBUTES:")
            structure_lines.append('  ' + _build_attributes_prompt(v_attrs, size_hints).replace('\n', '\n  '))

        for s in v.get('sizes', []):
            # Get size interpretations from DB
            vs_id = s.get('variant_size_id')
            interp_str = s.get('size_name', '')
            if vs_id:
                try:
                    from apps.product.models import VariantSize
                    vs = VariantSize.objects.select_related('size').get(id=vs_id)
                    interps = vs.size.get_interpretations_dict() if vs.size else {}
                    if interps:
                        interp_str = ', '.join(f'{k}: {v}' for k, v in interps.items())
                except Exception:
                    pass

            structure_lines.append(
                f"\n  SIZE variant_size_id={vs_id} [{interp_str}] SKU={s.get('sku', '')} stock={s.get('stock', 0)}:"
            )

            s_attrs = s.get('attributes', [])
            if s_attrs:
                structure_lines.append("    SIZE_ATTRIBUTES (УНИКАЛЬНЫЕ для этого размера: размерная сетка, обхваты, длина изделия):")
                structure_lines.append('    ' + _build_attributes_prompt(s_attrs, size_hints).replace('\n', '\n    '))

    attrs_structure = '\n'.join(structure_lines)

    if not attrs_structure.strip():
        return {'success': True, 'result': {}, 'reasoning': 'Нет атрибутов'}

    prompt = f"""Ты заполняешь карточку товара для маркетплейса. Посмотри на данные и фото товара.

ТОВАР:
{product_info}

СТРУКТУРА АТРИБУТОВ ДЛЯ ЗАПОЛНЕНИЯ:
{attrs_structure}

ИНСТРУКЦИИ:
1. select/multiselect — ТОЛЬКО option_id из предложенных опций
2. string — осмысленное значение на русском
3. int/float — число СТРОГО В ЕДИНИЦАХ указанных в суффиксе [мм], [см], [г]. Если суффикс [мм] — значение в миллиметрах, не сантиметрах. Думай о реальных физических размерах: длина джинсов ~800-1100мм а не 80, высота упаковки футболки ~300мм а не 30.
4. boolean — true/false

ДАННЫЕ ТОВАРА — используй их:
- Страна: ищи совпадение в опциях атрибута "страна"
- Состав ткани: для select — основной материал, для string — полный состав
- Сезон/стиль: бери из характеристик если есть
- По фото: определи тип одежды, фасон, длину, пол

РАЗМЕРЫ — для каждого SIZE заполни ОТДЕЛЬНО:
- У каждого размера указаны интерпретации (eu, int, ua). ВСЕГДА используй УКРАИНСКИЙ размер (ua) как приоритетный.
- Для атрибута "Размер" (select): ищи ТОЧНОЕ совпадение с ua размером в опциях. Например ua:42 → ищи опцию "42", ua:48 → ищи "48". НЕ выбирай похожие вроде "L1", "S-30", "L-Petite" — это НЕ те размеры.
- Для атрибута "Размер" (multiselect): выбирай ТОЛЬКО ОДНУ опцию — ua размер. НЕ добавляй eu и int как дополнительные опции. Один размер = один элемент в массиве [option_id].
- Если точного совпадения нет — попробуй eu или int размер.
- Обхваты и мерки — бери из стандартных размерных таблиц ниже
- Если не уверен в размере — null, но для остальных атрибутов СТАРАЙСЯ ЗАПОЛНИТЬ МАКСИМУМ. Лучше приблизительно чем пусто.

СТАНДАРТНЫЕ РАЗМЕРНЫЕ ТАБЛИЦЫ (женская одежда, см):
UA  | EU | INT | Грудь | Талия | Бёдра
40  | 34 | XS  |  82   |  63   |  88
42  | 36 | S   |  86   |  67   |  92
44  | 38 | M   |  90   |  71   |  96
46  | 40 | L   |  94   |  75   | 100
48  | 42 | XL  |  98   |  79   | 104
50  | 44 | XXL | 102   |  83   | 108
52  | 46 | 3XL | 106   |  87   | 112

СТАНДАРТНЫЕ РАЗМЕРНЫЕ ТАБЛИЦЫ (мужская одежда, см):
UA  | EU | INT | Грудь | Талия | Бёдра
44  | 38 | XS  |  88   |  73   |  92
46  | 40 | S   |  92   |  77   |  96
48  | 42 | M   |  96   |  81   | 100
50  | 44 | L   | 100   |  85   | 104
52  | 46 | XL  | 104   |  89   | 108
54  | 48 | XXL | 108   |  93   | 112
56  | 50 | 3XL | 112   |  97   | 116

Определи пол по названию/категории и используй соответствующую таблицу.

Ответь СТРОГО в формате JSON:
{{
  "product": {{"<mp_attribute_id>": <value>, ...}},
  "variants": {{
    "<variant_id>": {{"<mp_attribute_id>": <value>, ...}}
  }},
  "sizes": {{
    "<variant_size_id>": {{"<mp_attribute_id>": <value>, ...}}
  }},
  "reasoning": "что заполнил и почему"
}}

Значения: select→option_id(число), multiselect→[id,...], string→"текст", int/float→число, boolean→true/false, пропуск→null.

ВАЖНО: Заполняй ВСЕ атрибуты которые можешь определить. Чем больше заполнишь — тем лучше. null только если совсем невозможно определить."""

    # Build message content
    content: List[Dict] = []

    if with_images:
        images = _get_product_images(product, max_images=3)
        for img_data in images:
            content.append({
                'type': 'image',
                'source': {
                    'type': 'base64',
                    'media_type': img_data['media_type'],
                    'data': img_data['data'],
                },
            })

    content.append({'type': 'text', 'text': prompt})

    try:
        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=8192,
            messages=[{'role': 'user', 'content': content}],
        )

        # Log usage
        from apps.marketplaces.models import AIUsageLog
        AIUsageLog.log(response, 'claude-sonnet-4-20250514', 'fill_marketplace',
                       product=product, marketplace=marketplace)

        text = response.content[0].text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()

        result = json.loads(text)

        def parse_filled(d):
            out = {}
            if isinstance(d, dict):
                for k, v in d.items():
                    if v is not None:
                        out[int(k)] = v
            return out

        filled_product = parse_filled(result.get('product', {}))
        filled_variants = {}
        for vid, attrs in result.get('variants', {}).items():
            f = parse_filled(attrs)
            if f:
                filled_variants[int(vid)] = f
        filled_sizes = {}
        for vsid, attrs in result.get('sizes', {}).items():
            f = parse_filled(attrs)
            if f:
                filled_sizes[int(vsid)] = f

        return {
            'success': True,
            'filled_product': filled_product,
            'filled_variants': filled_variants,
            'filled_sizes': filled_sizes,
            'reasoning': result.get('reasoning', ''),
        }

    except Exception as e:
        logger.error(f'AI fill error: {e}')
        return {'success': False, 'error': str(e)}


def _build_product_context(product) -> str:
    lines = [
        f"Название: {product.name}",
        f"Категория: {product.category.name if product.category else '—'}",
        f"Бренд: {product.brand.name if product.brand else '—'}",
        f"Страна: {product.country.name if product.country else '—'}",
        f"Цена: {product.price} грн",
    ]

    if product.description:
        lines.append(f"Описание: {product.description[:500]}")

    # Product composition
    compositions = product.compositions.select_related('composition').all()
    comp_strs = []
    for pc in compositions:
        comp_strs.append(f"{pc.composition.name} {pc.value}%")
    if comp_strs:
        lines.append(f"Состав ткани: {', '.join(comp_strs)}")

    # Product attributes
    from apps.product.models import ProductAttribute
    attrs = ProductAttribute.objects.filter(product=product).select_related(
        'attribute_group', 'value_single_attribute'
    ).prefetch_related('value_multi_attributes')

    if attrs.exists():
        lines.append("Характеристики:")
        for pa in attrs:
            group_name = pa.attribute_group.name
            if pa.attribute_group.data_type == 'single_attr' and pa.value_single_attribute:
                lines.append(f"  {group_name}: {pa.value_single_attribute.name}")
            elif pa.attribute_group.data_type == 'multi_attr':
                vals = ', '.join(a.name for a in pa.value_multi_attributes.all())
                if vals:
                    lines.append(f"  {group_name}: {vals}")
            elif pa.attribute_group.data_type == 'integer' and pa.value_int is not None:
                lines.append(f"  {group_name}: {pa.value_int}")
            elif pa.attribute_group.data_type == 'sting' and pa.value_str:
                lines.append(f"  {group_name}: {pa.value_str}")

    # Variants with detailed size info
    variants = product.variants.select_related('color').prefetch_related(
        'sizes__size__interpretations__grid'
    ).all()
    if variants.exists():
        lines.append("Варианты:")
        for v in variants[:5]:
            size_strs = []
            for vs in v.sizes.all():
                interps = vs.size.get_interpretations_dict() if vs.size else {}
                interp_str = ', '.join(f'{k}: {v}' for k, v in interps.items())
                size_strs.append(f"{interp_str} (остаток: {vs.stock})")
            lines.append(f"  {v.code} ({v.color.name}):")
            for ss in size_strs:
                lines.append(f"    - {ss}")

    return '\n'.join(lines)


def _get_product_images(product, max_images: int = 3) -> List[Dict]:
    """Получить base64-изображения товара (средние тамбнейлы или оригиналы)."""
    import base64
    import os

    images = []
    media_root = settings.MEDIA_ROOT

    for variant in product.variants.prefetch_related('images').all():
        for vi in variant.images.all()[:max_images]:
            # Prefer medium thumbnail
            thumb_path = vi.thumbnails.get('m') or vi.thumbnails.get('s')
            if thumb_path:
                full_path = os.path.join(media_root, thumb_path)
            elif vi.image:
                full_path = vi.image.path
            else:
                continue

            if not os.path.exists(full_path):
                continue

            try:
                with open(full_path, 'rb') as f:
                    data = base64.standard_b64encode(f.read()).decode('utf-8')

                ext = full_path.rsplit('.', 1)[-1].lower()
                media_type = {
                    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                    'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif',
                }.get(ext, 'image/jpeg')

                images.append({'data': data, 'media_type': media_type})
            except Exception:
                continue

            if len(images) >= max_images:
                return images

    return images


def _build_attributes_prompt(attributes_data: List[Dict], size_hints: List[str] = None) -> str:
    """Build attribute list for prompt. Filters size options smartly."""
    lines = []
    skip_codes = {'brand', 'measure'}

    # Size-related attribute names (case-insensitive matching)
    SIZE_ATTR_KEYWORDS = {'розмір', 'размер', 'size'}

    for attr in attributes_data:
        code = attr.get('external_code', '')
        if code in skip_codes:
            continue

        attr_id = attr['mp_attribute_id']
        name = attr['name']
        attr_type = attr['attr_type']
        required = '(ОБЯЗАТЕЛЬНЫЙ)' if attr.get('is_required') else ''
        suffix = f" [{attr.get('suffix')}]" if attr.get('suffix') else ''

        line = f"ID={attr_id} | {name}{suffix} | тип: {attr_type} {required}"

        options = attr.get('options', [])
        if options and attr_type in ('select', 'multiselect'):
            # Smart filtering for size attributes with many options
            is_size_attr = any(kw in name.lower() for kw in SIZE_ATTR_KEYWORDS)

            if is_size_attr and len(options) > 50 and size_hints:
                # Filter options to only those matching product sizes
                filtered = []
                for o in options:
                    oname = str(o['name']).strip()
                    for hint in size_hints:
                        if oname == hint or oname.lower() == hint.lower():
                            filtered.append(o)
                            break
                if filtered:
                    opts_text = ', '.join(f'{o["id"]}="{o["name"]}"' for o in filtered)
                    line += f"\n  Опции (отфильтрованы по размерам товара): {opts_text}"
                else:
                    # No exact match — show all simple numeric sizes
                    simple = [o for o in options if o['name'].strip().isdigit() or
                              o['name'].strip() in ('XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL')]
                    show = simple[:100] if simple else options[:80]
                    opts_text = ', '.join(f'{o["id"]}="{o["name"]}"' for o in show)
                    if len(options) > len(show):
                        opts_text += f'... (ещё {len(options) - len(show)})'
                    line += f"\n  Опции: {opts_text}"
            else:
                show = options[:80]
                opts_text = ', '.join(f'{o["id"]}="{o["name"]}"' for o in show)
                if len(options) > 80:
                    opts_text += f'... (ещё {len(options) - 80})'
                line += f"\n  Опции: {opts_text}"

        lines.append(line)

    return '\n'.join(lines)


def ai_fill_base_product_data(product, attribute_groups: List[Dict]) -> Dict[str, Any]:
    """
    AI-заполнение базовых данных товара (описание, состав, характеристики) по фото.
    attribute_groups — список доступных групп атрибутов [{id, name, data_type, attributes: [{id, name}]}]
    """
    if not HAS_ANTHROPIC:
        return {'success': False, 'error': 'anthropic package not installed'}

    client = anthropic.Anthropic(
        api_key=getattr(settings, 'ANTHROPIC_API_KEY', None)
    )

    # Current product data
    current = _build_product_context(product)

    # Build attribute groups prompt
    ag_lines = []
    for ag in attribute_groups:
        attrs_list = ag.get('attributes', [])
        if ag['data_type'] in ('single_attr', 'multi_attr') and attrs_list:
            opts = ', '.join(f'{a["id"]}="{a["name"]}"' for a in attrs_list[:50])
            ag_lines.append(
                f'  group_id={ag["id"]} "{ag["name"]}" тип={ag["data_type"]} '
                f'{"(обязательный)" if ag.get("required") else ""}\n    Опции: {opts}'
            )
        else:
            ag_lines.append(
                f'  group_id={ag["id"]} "{ag["name"]}" тип={ag["data_type"]} '
                f'{"(обязательный)" if ag.get("required") else ""}'
            )

    ag_prompt = '\n'.join(ag_lines) if ag_lines else 'Нет групп атрибутов'

    # Get compositions list for reference
    from apps.attributes.models import Composition
    all_compositions = list(Composition.objects.all().values_list('id', 'name'))
    comp_list = ', '.join(f'{c[0]}="{c[1]}"' for c in all_compositions)

    prompt = f"""Ты заполняешь базовые данные товара интернет-магазина одежды/аксессуаров.
Посмотри на фото товара и текущие данные, заполни недостающее.

ТЕКУЩИЕ ДАННЫЕ ТОВАРА:
{current}

ДОСТУПНЫЕ ГРУППЫ ХАРАКТЕРИСТИК (наши, не маркетплейса):
{ag_prompt}

ДОСТУПНЫЕ СОСТАВЫ ТКАНИ:
{comp_list}

Заполни JSON с данными которые можешь определить по фото и контексту:
{{
  "description": "описание товара на русском (2-4 предложения, SEO-оптимизированное) или null если уже заполнено хорошо",
  "compositions": [{{"composition_id": <id из списка>, "value": <процент>}}] или null если уже заполнено,
  "our_attributes": [
    {{
      "attribute_group_id": <group_id>,
      "value_single_attribute": <id опции для single_attr> или null,
      "value_multi_attributes": [<id опций>] для multi_attr или null,
      "value_int": <число> для integer или null,
      "value_str": "<текст>" для sting или null
    }}
  ] или null если нечего заполнять,
  "reasoning": "что определил по фото"
}}

ИНСТРУКЦИИ:
1. По фото определи: тип одежды, фасон, длину, стиль, сезон, пол, материал (визуально).
2. Описание: если текущее пустое или слабое — напиши SEO-описание. Если хорошее — верни null.
3. Состав: если видно ткань на фото — предположи. Если уже заполнен — верни null.
4. Характеристики: заполни только те группы, которые можешь определить. Для select — ТОЛЬКО из предложенных опций.
5. Если не уверен — лучше null чем ошибка.

Ответь ТОЛЬКО JSON."""

    # Build message with images
    content: List[Dict] = []
    images = _get_product_images(product, max_images=4)
    for img_data in images:
        content.append({
            'type': 'image',
            'source': {
                'type': 'base64',
                'media_type': img_data['media_type'],
                'data': img_data['data'],
            },
        })

    if not images:
        return {'success': False, 'error': 'Нет фото товара'}

    content.append({'type': 'text', 'text': prompt})

    try:
        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4096,
            messages=[{'role': 'user', 'content': content}],
        )

        # Log usage
        from apps.marketplaces.models import AIUsageLog
        AIUsageLog.log(response, 'claude-sonnet-4-20250514', 'fill_base', product=product)

        text = response.content[0].text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()

        result = json.loads(text)
        return {
            'success': True,
            'data': result,
        }

    except Exception as e:
        logger.error(f'AI base fill error: {e}')
        return {'success': False, 'error': str(e)}
