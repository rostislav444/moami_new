---
name: Next session - Full product admin CRUD
description: Detailed context for building complete product admin in frontend_admin with all CRUD operations replicating Django admin
type: project
---

## Задача

Построить полную CRUD админку товаров в `frontend_admin` (Next.js), полностью заменяющую Django admin из `backend/apps/product/admin/`.

**Why:** Текущий интерфейс `/products/[id]` — только readonly + формы маркетплейсов. Нужна полноценная админка с редактированием товаров, вариантов, размеров, картинок, атрибутов.

**How to apply:** Сначала backend API, потом frontend. Референс — Django admin в `backend/apps/product/admin/`.

---

## Что уже сделано

### Backend (marketplaces app):
- `ProductAdminViewSet` в `backend/apps/marketplaces/views/product_admin_views.py` — **read-only** list/detail + marketplace forms
- `ProductListAdminSerializer`, `ProductDetailAdminSerializer` — read-only сериализаторы
- `SaveAttributesSerializer` — сохранение marketplace атрибутов
- AI fill endpoint (`ai-fill/{marketplace_id}/`)
- Attribute levels (`MarketplaceAttributeLevel`) — конфигурация product/variant/size/brand/color/country

### Frontend:
- `/products/page.tsx` — карточный список товаров с фильтрами и статусами MP
- `/products/[id]/page.tsx` — sidebar layout + табы (Основное + маркетплейсы)
  - Таб "Основное" — readonly инфо
  - Табы MP — формы атрибутов с AI fill, SearchableSelect, grouped sections
- Индиго тема (globals.css), карточки с тенями

---

## Что нужно сделать

### 1. Backend API — Product CRUD

**Файл:** Расширить `backend/apps/marketplaces/views/product_admin_views.py` или создать отдельный `backend/apps/product/api/`

Endpoints:
```
PATCH /admin-products/{id}/                    — обновить товар (name, description, extra_description, category, brand, country, code, prices)
POST  /admin-products/                         — создать товар

# Варианты
POST   /admin-products/{id}/variants/          — создать вариант (code, color)
PATCH  /admin-products/{id}/variants/{vid}/    — обновить вариант
DELETE /admin-products/{id}/variants/{vid}/    — удалить вариант

# Изображения вариантов
POST   /variant-images/                        — загрузить (multipart, variant_id + image file)
DELETE /variant-images/{id}/                   — удалить
POST   /variant-images/reorder/               — {variant_id, image_ids: [ordered]}

# Размеры
POST   /admin-products/{id}/variants/{vid}/sizes/     — добавить размер (size_id, stock)
PATCH  /variant-sizes/{id}/                           — обновить (stock)
DELETE /variant-sizes/{id}/                           — удалить

# Атрибуты товара (наши, не маркетплейса)
GET    /admin-products/{id}/our-attributes/           — список с текущими значениями
POST   /admin-products/{id}/our-attributes/           — сохранить [{attribute_group_id, value_single_attribute, value_multi_attributes, value_int, value_str}]

# Состав
GET    /admin-products/{id}/compositions/             — текущий состав
POST   /admin-products/{id}/compositions/             — сохранить [{composition_id, value}]

# Справочники для dropdown'ов
GET    /admin-lookups/brands/                         — [{id, name}]
GET    /admin-lookups/countries/                      — [{id, name}]
GET    /admin-lookups/colors/                         — [{id, name, code}]
GET    /admin-lookups/categories/                     — дерево [{id, name, level, size_group}]
GET    /admin-lookups/sizes/?size_group={id}          — [{id, name, interpretations}]
GET    /admin-lookups/compositions/                   — [{id, name}]
GET    /admin-lookups/attribute-groups/?category={id}  — [{id, name, data_type, required, attributes: [{id, name}]}]
```

### 2. Frontend — Таб "Основное" (editable)

Сейчас readonly. Нужно сделать editable формы:

**Секция "Основные данные":**
- name — Input
- code — Input
- category — SearchableSelect (дерево)
- brand — SearchableSelect
- country — SearchableSelect
- description — textarea
- extra_description — rich text editor (можно TipTap или просто textarea)

**Секция "Цены":**
- price, promo_price, old_price — number inputs в одну строку

**Секция "Состав ткани":**
- Таблица: composition (dropdown) + value (%) + кнопка удалить
- Кнопка "Добавить"

**Секция "Характеристики" (ProductAttribute):**
- Динамические поля по category.attribute_groups:
  - single_attr → SearchableSelect из attributes группы
  - multi_attr → SearchableMultiSelect из attributes группы
  - integer → number input
  - sting (typo в модели!) → text input
- Показывать required группы + optional

### 3. Frontend — Варианты (inline editing)

Каждый вариант — раскрывающаяся карточка:

**Header варианта:** фото, код, цвет, кол-во размеров, actions (delete)

**Внутри:**
- code — Input (editable)
- color — SearchableSelect
- Изображения — drag-drop grid:
  - Превью 150x150
  - Drag-sort (react-beautiful-dnd или @dnd-kit/sortable)
  - Кнопка удалить на каждом
  - Кнопка добавить (file upload)
  - Checkbox "Исключить на площадках" (exclude_at_marketplace)
- Размеры — таблица:
  - size (dropdown, filtered by category.size_group)
  - max_size (dropdown, optional)
  - stock (number)
  - SKU (readonly computed)
  - Кнопка удалить
  - Кнопка "Добавить размер"

**Кнопка "Добавить вариант"** — modal с code + color

### 4. Frontend — Кнопка "Сохранить"

Один большой Save который:
1. PATCH product (основные поля)
2. Для каждого changed варианта — PATCH variant
3. Для новых вариантов — POST
4. Для удалённых — DELETE
5. Сохранить compositions
6. Сохранить our-attributes
7. Reorder images если менялся порядок

Или проще — один endpoint `POST /admin-products/{id}/save-all/` который принимает всё.

---

## Ключевые модели (reference)

```python
# Product fields
name, code, category(FK), brand(FK), country(FK), collections(M2M),
price, promo_price, old_price, description, extra_description, slug(auto)

# Variant fields
product(FK), code, color(FK), rozetka_code, slug(auto)
related: images(VariantImage), sizes(VariantSize), video(VariantVideo)

# VariantImage
variant(FK), image(ImageField), index(PositiveInt, sortable),
exclude_at_marketplace(bool), thumbnails(JSONField: {xs,s,m,l: path})

# VariantSize
variant(FK), size(FK filtered by category.size_group),
max_size(FK optional), stock(PositiveInt default=1)
unique_together: (variant, size)

# ProductAttribute
product(FK), attribute_group(FK),
value_single_attribute(FK nullable), value_multi_attributes(M2M),
value_int(PositiveInt nullable), value_str(CharField nullable)
unique_together: (product, attribute_group)

# ProductComposition
product(FK), composition(FK), value(PositiveInt %)
unique_together: (product, composition)

# CategoryAttributeGroup
category(FK), attribute_group(FK), required(bool)
# Determines which attribute groups are available for a category
# Includes ancestors: product.category.get_ancestors() + self

# AttributeGroup.data_type choices:
'multi_attr' → use value_multi_attributes
'single_attr' → use value_single_attribute
'integer' → use value_int
'sting' (TYPO!) → use value_str
```

## Файлы для изменения

### Backend:
- `backend/apps/marketplaces/views/product_admin_views.py` — добавить write operations
- `backend/apps/marketplaces/serializers/product_admin_serializers.py` — write serializers
- `backend/apps/marketplaces/urls.py` — новые routes
- Возможно новый файл `backend/apps/marketplaces/views/lookup_views.py` — справочники

### Frontend:
- `frontend_admin/src/app/products/[id]/page.tsx` — полный редизайн таба "Основное"
- `frontend_admin/src/lib/api.ts` — новые API endpoints
- Возможно вынести компоненты: `ImageUploader`, `DragSortImages`, `DynamicAttributes`

## Дизайн (текущий)
- Тема: indigo-600 accent, slate-50 background, white cards with shadow-sm
- Layout: sidebar (272px) с инфо + правая часть с табами
- Формы: max-w-lg single column, SearchableSelect для dropdowns
