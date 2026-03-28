/**
 * API клиент для работы с Django backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Types
// =============================================================================

export interface Marketplace {
  id: number;
  name: string;
  slug: string;
  integration_type: 'xml_feed' | 'api' | 'both';
  is_active: boolean;
  api_config: Record<string, unknown>;
  feed_template: string | null;
  feed_filename: string | null;
  feed_url: string | null;
  last_sync: string | null;
  last_feed_generated: string | null;
}

export interface MarketplaceCategory {
  id: number;
  marketplace: number;
  external_id: string;
  external_code: string;
  name: string;
  name_uk: string | null;
  parent: number | null;
  has_children: boolean;
  is_active: boolean;
  children?: MarketplaceCategory[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  level: number;
}

export interface CategoryMapping {
  id: number;
  category: number;
  category_name: string;
  marketplace_category: number;
  marketplace_category_name: string;
  is_active: boolean;
}

export interface MarketplaceAttributeSet {
  id: number;
  marketplace: number;
  external_code: string;
  name: string;
  name_uk: string | null;
  attributes_count: number;
}

export interface MarketplaceAttributeOption {
  id: number;
  external_code: string;
  name: string;
  name_uk: string | null;
}

export interface MarketplaceAttribute {
  id: number;
  attribute_set: number;
  external_code: string;
  name: string;
  name_uk: string | null;
  attr_type: 'select' | 'multiselect' | 'string' | 'text' | 'int' | 'float' | 'array';
  is_required: boolean;
  is_system: boolean;
  suffix: string | null;
  options?: MarketplaceAttributeOption[];
}

export interface FeedTemplate {
  id: number;
  marketplace: number;
  name: string;
  template_type: 'header' | 'product' | 'footer' | 'variant';
  content: string;
  is_active: boolean;
}

// =============================================================================
// Marketplaces API
// =============================================================================

export const marketplacesAPI = {
  list: () => fetchAPI<Marketplace[]>('/marketplaces/marketplaces/'),

  get: (id: number) => fetchAPI<Marketplace>(`/marketplaces/marketplaces/${id}/`),

  create: (data: {
    name: string;
    slug: string;
    integration_type: 'xml_feed' | 'api' | 'both';
    is_active?: boolean;
    api_config?: Record<string, unknown>;
    feed_filename?: string;
  }) =>
    fetchAPI<Marketplace>('/marketplaces/marketplaces/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sync: (id: number, type: 'categories' | 'attributes' | 'options' | 'all') =>
    fetchAPI<{ success: boolean; synced: number }>(`/marketplaces/sync/${type}/`, {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: id }),
    }),

  syncAttributes: (marketplaceId: number, categoryCodes: string[]) =>
    fetchAPI<{ success: boolean; synced: number }>('/marketplaces/sync/attributes/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, category_codes: categoryCodes }),
    }),

  stats: (id: number) =>
    fetchAPI<{
      id: number;
      name: string;
      categories_count: number;
      categories_with_children: number;
      leaf_categories: number;
      mapped_categories: number;
      attribute_sets_count: number;
      attribute_options_count: number;
      last_sync: string | null;
      last_feed_generated: string | null;
    }>(`/marketplaces/marketplaces/${id}/stats/`),
};

// =============================================================================
// Categories API
// =============================================================================

// Helper to flatten nested categories with level
interface NestedCategory {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  children?: NestedCategory[];
}

function flattenCategories(categories: NestedCategory[], level = 0): Category[] {
  const result: Category[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent,
      level,
    });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1));
    }
  }
  return result;
}

export const categoriesAPI = {
  // Наши категории (flatten nested structure)
  listOur: async (): Promise<Category[]> => {
    const nested = await fetchAPI<NestedCategory[]>('/category/categories/');
    return flattenCategories(nested);
  },

  // Категории маркетплейса
  listMarketplace: (marketplaceId: number) =>
    fetchAPI<MarketplaceCategory[]>('/marketplaces/marketplace-categories/', {
      params: { marketplace: marketplaceId, leaf_only: 'true' },
    }),

  // Дерево категорий маркетплейса (только корневой уровень)
  tree: (marketplaceId: number) =>
    fetchAPI<MarketplaceCategory[]>('/marketplaces/marketplace-categories/tree/', {
      params: { marketplace: marketplaceId },
    }),

  // Получить категорию по ID
  getCategory: (categoryId: number) =>
    fetchAPI<MarketplaceCategory & { full_path?: string }>(`/marketplaces/marketplace-categories/${categoryId}/`),

  // Получить детей категории
  getChildren: (categoryId: number) =>
    fetchAPI<MarketplaceCategory[]>(`/marketplaces/marketplace-categories/${categoryId}/children/`),

  // Плоский список с пагинацией и поиском
  listFlat: (marketplaceId: number, params?: { search?: string; page?: number; page_size?: number; leaf_only?: boolean }) =>
    fetchAPI<PaginatedResponse<MarketplaceCategory>>('/marketplaces/marketplace-categories/flat/', {
      params: {
        marketplace: marketplaceId,
        search: params?.search,
        page: params?.page,
        page_size: params?.page_size,
        leaf_only: params?.leaf_only ? 'true' : undefined,
      },
    }),

  // Создать категорию маркетплейса
  createMarketplaceCategory: (data: {
    marketplace: number;
    name: string;
    name_uk?: string;
    external_id?: string;
    external_code?: string;
    parent?: number | null;
  }) =>
    fetchAPI<MarketplaceCategory>('/marketplaces/marketplace-categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Обновить категорию маркетплейса
  updateMarketplaceCategory: (id: number, data: Partial<{
    name: string;
    name_uk: string;
    external_id: string;
    external_code: string;
    parent: number | null;
    is_active: boolean;
  }>) =>
    fetchAPI<MarketplaceCategory>(`/marketplaces/marketplace-categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Удалить категорию маркетплейса
  deleteMarketplaceCategory: (id: number) =>
    fetchAPI<void>(`/marketplaces/marketplace-categories/${id}/`, { method: 'DELETE' }),

  // Переместить категорию (сменить родителя)
  moveMarketplaceCategory: (id: number, parentId: number | null) =>
    fetchAPI<{ success: boolean; category: MarketplaceCategory }>(
      `/marketplaces/marketplace-categories/${id}/move/`,
      {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId }),
      }
    ),

  // Маппинги
  listMappings: (params?: { category?: number; marketplace?: number }) =>
    fetchAPI<CategoryMapping[]>('/marketplaces/category-mappings/', { params }),

  createMapping: (data: { category_id: number; marketplace_category_id: number }) =>
    fetchAPI<CategoryMapping>('/marketplaces/category-mappings/', {
      method: 'POST',
      body: JSON.stringify({
        category: data.category_id,
        marketplace_category: data.marketplace_category_id,
      }),
    }),

  deleteMapping: (id: number) =>
    fetchAPI<void>(`/marketplaces/category-mappings/${id}/`, { method: 'DELETE' }),

  bulkCreateMappings: (mappings: { category_id: number; marketplace_category_id: number }[]) =>
    fetchAPI<{ success: boolean; created: number }>('/marketplaces/category-mappings/bulk_create/', {
      method: 'POST',
      body: JSON.stringify({
        mappings: mappings.map(m => ({
          category: m.category_id,
          marketplace_category: m.marketplace_category_id,
        })),
      }),
    }),

  autoMatch: (marketplaceId: number) =>
    fetchAPI<{ success: boolean; matched: number }>('/marketplaces/category-mappings/auto_match/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId }),
    }),

  cleanupUnmapped: (marketplaceId: number) =>
    fetchAPI<{ success: boolean; deleted: number; remaining: number }>('/marketplaces/category-mappings/cleanup-unmapped/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId }),
    }),

  aiAssistant: (marketplaceId: number, prompt: string, data?: string) =>
    fetchAPI<{
      success: boolean;
      message: string;
      created_categories: number;
      created_mappings: number;
      errors: string[];
      total_actions: number;
    }>('/marketplaces/category-mappings/ai-assistant/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, prompt, data }),
    }),
};

// =============================================================================
// Attributes API
// =============================================================================

export const attributesAPI = {
  listSets: (marketplaceId: number, params?: { page?: number; search?: string }) =>
    fetchAPI<{ count: number; next: string | null; previous: string | null; results: MarketplaceAttributeSet[] }>(
      '/marketplaces/attribute-sets/',
      { params: { marketplace: marketplaceId, ...params } },
    ),

  listAllSets: async (marketplaceId: number): Promise<MarketplaceAttributeSet[]> => {
    const all: MarketplaceAttributeSet[] = [];
    let page = 1;
    while (true) {
      const res = await fetchAPI<{ count: number; next: string | null; results: MarketplaceAttributeSet[] }>(
        '/marketplaces/attribute-sets/',
        { params: { marketplace: marketplaceId, page, page_size: 200 } },
      );
      all.push(...res.results);
      if (!res.next) break;
      page++;
    }
    return all;
  },

  deleteAllSets: (marketplaceId: number) =>
    fetchAPI<{ deleted: number }>('/marketplaces/attribute-sets/delete-all/', {
      method: 'DELETE',
      params: { marketplace: marketplaceId },
    }),

  getSet: (id: number) =>
    fetchAPI<MarketplaceAttributeSet>(`/marketplaces/attribute-sets/${id}/`),

  listAttributes: (params?: { marketplace?: number; attribute_set?: number; required_only?: string }) =>
    fetchAPI<MarketplaceAttribute[]>('/marketplaces/marketplace-attributes/', { params }),

  getSetAttributes: (setId: number) =>
    fetchAPI<MarketplaceAttribute[]>(`/marketplaces/attribute-sets/${setId}/attributes/`),
};

// =============================================================================
// Feed Templates API (нужно будет добавить в Django)
// =============================================================================

export const feedTemplatesAPI = {
  list: (marketplaceId: number) =>
    fetchAPI<FeedTemplate[]>('/marketplaces/feed-templates/', {
      params: { marketplace: marketplaceId },
    }),

  get: (id: number) => fetchAPI<FeedTemplate>(`/marketplaces/feed-templates/${id}/`),

  create: (data: Partial<FeedTemplate>) =>
    fetchAPI<FeedTemplate>('/marketplaces/feed-templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<FeedTemplate>) =>
    fetchAPI<FeedTemplate>(`/marketplaces/feed-templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchAPI<void>(`/marketplaces/feed-templates/${id}/`, { method: 'DELETE' }),

  preview: (marketplaceId: number, productId?: number) =>
    fetchAPI<{ xml: string; products_count: number; generation_time: number }>('/marketplaces/feed-templates/preview/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, product_id: productId }),
    }),

  generate: (marketplaceId: number) =>
    fetchAPI<{ xml: string; products_count: number; generation_time: number; file_path: string }>('/marketplaces/feed-templates/generate/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId }),
    }),

  downloadUrl: (marketplaceId: number) =>
    `${API_BASE}/marketplaces/feed-templates/download/?marketplace_id=${marketplaceId}`,

  variables: () =>
    fetchAPI<Record<string, Record<string, string>>>('/marketplaces/feed-templates/variables/'),
};

// =============================================================================
// AI Assistant API
// =============================================================================

export interface AISuggestion {
  category_id?: number;
  external_code?: string;
  confidence?: number;
  reason?: string;
}

export interface AIAttributeSuggestion {
  attribute_code: string;
  value: unknown;
  option_id?: number;
}

export interface AIMapResult {
  product_id: number;
  marketplace: string;
  category: AISuggestion | null;
  attributes: Array<{
    code: string;
    name: string;
    value: unknown;
    saved: boolean;
  }>;
  errors: string[];
}

export interface AIDiscoveredAttribute {
  name: string;
  name_uk?: string;
  code?: string;
  type: 'select' | 'multiselect' | 'string' | 'int' | 'float' | 'text';
  is_required: boolean;
  description?: string;
  possible_values?: string[];
}

export interface AIDiscoveryResult {
  success: boolean;
  marketplace?: string;
  category?: string;
  attributes?: AIDiscoveredAttribute[];
  sources?: string[];
  notes?: string;
  error?: string;
}

export const aiAPI = {
  // Проверить статус AI ассистента
  status: () =>
    fetchAPI<{
      available: boolean;
      has_api_key: boolean;
      has_library: boolean;
      message: string;
    }>('/marketplaces/ai/status/'),

  // Предложить категорию для товара
  suggestCategory: (marketplaceId: number, productId: number) =>
    fetchAPI<{ success: boolean; suggestion: AISuggestion }>('/marketplaces/ai/suggest_category/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, product_id: productId }),
    }),

  // Предложить атрибуты для товара
  suggestAttributes: (
    marketplaceId: number,
    productId: number,
    categoryCode: string,
    includeOptional = false
  ) =>
    fetchAPI<{ success: boolean; attributes: AIAttributeSuggestion[] }>(
      '/marketplaces/ai/suggest_attributes/',
      {
        method: 'POST',
        body: JSON.stringify({
          marketplace_id: marketplaceId,
          product_id: productId,
          category_code: categoryCode,
          include_optional: includeOptional,
        }),
      }
    ),

  // Полный автомаппинг товара
  autoMapProduct: (marketplaceId: number, productId: number) =>
    fetchAPI<AIMapResult>('/marketplaces/ai/auto_map_product/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, product_id: productId }),
    }),

  // Массовый автомаппинг
  autoMapBulk: (marketplaceId: number, productIds?: number[], categoryId?: number) =>
    fetchAPI<{ success: boolean; processed: number; results: AIMapResult[] }>(
      '/marketplaces/ai/auto_map_bulk/',
      {
        method: 'POST',
        body: JSON.stringify({
          marketplace_id: marketplaceId,
          product_ids: productIds,
          category_id: categoryId,
        }),
      }
    ),

  // Поиск атрибутов категории в интернете
  discoverAttributes: (marketplaceName: string, categoryName: string) =>
    fetchAPI<AIDiscoveryResult>('/marketplaces/ai/discover_attributes/', {
      method: 'POST',
      body: JSON.stringify({
        marketplace_name: marketplaceName,
        category_name: categoryName,
      }),
    }),

  // Создать атрибуты из результатов discovery
  createDiscoveredAttributes: (
    marketplaceId: number,
    categoryCode: string,
    discoveryResult: AIDiscoveryResult
  ) =>
    fetchAPI<{ success: boolean; attribute_set_id?: number; attributes?: unknown[] }>(
      '/marketplaces/ai/create_discovered_attributes/',
      {
        method: 'POST',
        body: JSON.stringify({
          marketplace_id: marketplaceId,
          category_code: categoryCode,
          discovery_result: discoveryResult,
        }),
      }
    ),

  // Автоматически найти и создать атрибуты для категории
  autoDiscoverAndCreate: (marketplaceId: number, categoryId: number) =>
    fetchAPI<{
      success: boolean;
      phase?: string;
      error?: string;
      discovery?: AIDiscoveryResult;
      created?: { success: boolean; attribute_set_id?: number; attributes?: unknown[] };
    }>('/marketplaces/ai/auto_discover_and_create/', {
      method: 'POST',
      body: JSON.stringify({
        marketplace_id: marketplaceId,
        category_id: categoryId,
      }),
    }),

  // Парсинг файла с атрибутами через Claude
  parseAttributesFile: async (file: File, marketplaceId?: number, categoryCode?: string): Promise<AIDiscoveryResult & { saved_count?: number; size_grid?: Record<string, string>[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (marketplaceId) formData.append('marketplace_id', String(marketplaceId));
    if (categoryCode) formData.append('category_code', categoryCode);

    const response = await fetch(`${API_BASE}/marketplaces/ai/parse_attributes_file/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка загрузки файла');
    }

    return response.json();
  },

  // Сохранить распарсенные атрибуты
  saveParsedAttributes: (
    marketplaceId: number,
    categoryCode: string,
    categoryName: string,
    attributes: AIDiscoveredAttribute[]
  ) =>
    fetchAPI<{
      success: boolean;
      attribute_set_id?: number;
      attributes_count?: number;
    }>('/marketplaces/ai/save_parsed_attributes/', {
      method: 'POST',
      body: JSON.stringify({
        marketplace_id: marketplaceId,
        category_code: categoryCode,
        category_name: categoryName,
        attributes,
      }),
    }),

  // AI предложить маппинг категорий
  suggestCategoryMappings: (marketplaceId: number) =>
    fetchAPI<{
      success: boolean;
      suggestions: Array<{
        our_id: number;
        our_name: string;
        mp_id: number;
        mp_name: string;
        confidence: number;
        reason: string;
      }>;
      total_our_categories?: number;
      total_mp_categories?: number;
      message?: string;
      error?: string;
    }>('/marketplaces/ai/suggest_category_mappings/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId }),
    }),
};

// =============================================================================
// Attribute Levels API (Categories Config)
// =============================================================================

export interface AttributeConfigItem {
  mp_attribute_id: number;
  external_code: string;
  name: string;
  name_uk: string;
  attr_type: string;
  is_required: boolean;
  is_system: boolean;
  group_name: string;
  suffix: string;
  options_count: number;
  level: string | null;
  level_id: number | null;
}

export interface CategoryAttributeConfig {
  category_mapping_id: number;
  our_category_id: number;
  our_category_name: string;
  mp_category_id: number;
  mp_category_name: string;
  mp_category_code: string;
  attribute_set_id: number | null;
  attribute_set_name: string;
  total_attributes: number;
  configured_attributes: number;
  attributes: AttributeConfigItem[];
}

export interface CategoryMappingSummary {
  category_mapping_id: number;
  our_category_id: number;
  our_category_name: string;
  mp_category_id: number;
  mp_category_name: string;
  mp_category_code: string;
  total_attributes: number;
  configured_attributes: number;
}

export const attributeLevelsAPI = {
  mappingsList: (marketplaceId: number) =>
    fetchAPI<CategoryMappingSummary[]>(`/marketplaces/attribute-levels/mappings-list/${marketplaceId}/`),

  config: (categoryMappingId: number) =>
    fetchAPI<CategoryAttributeConfig>(`/marketplaces/attribute-levels/config/${categoryMappingId}/`),

  bulkUpdate: (categoryMappingId: number, levels: { marketplace_attribute_id: number; level: string }[]) =>
    fetchAPI<{ success: boolean; updated: number }>('/marketplaces/attribute-levels/bulk_update/', {
      method: 'POST',
      body: JSON.stringify({ category_mapping_id: categoryMappingId, levels }),
    }),

  aiLoadAttributes: (categoryMappingId: number) =>
    fetchAPI<{ success: boolean; created_attributes: number; created_options: number; total_in_set: number; error?: string }>(
      '/marketplaces/attribute-levels/ai-load-attributes/',
      { method: 'POST', body: JSON.stringify({ category_mapping_id: categoryMappingId }) },
    ),

  aiAssignCategory: (categoryMappingId: number) =>
    fetchAPI<{ success: boolean; saved: number; error?: string }>(
      '/marketplaces/attribute-levels/ai-assign-category/',
      { method: 'POST', body: JSON.stringify({ category_mapping_id: categoryMappingId }) },
    ),

  aiAssign: (marketplaceId: number) =>
    fetchAPI<{ success: boolean; saved: number; categories_processed: number; errors: string[] }>(
      `/marketplaces/attribute-levels/ai-assign/${marketplaceId}/`,
      { method: 'POST' },
    ),
};

// =============================================================================
// Product Admin API
// =============================================================================

export interface ProductListItem {
  id: number;
  name: string;
  category: number;
  category_name: string;
  brand_name: string | null;
  price: number;
  promo_price: number | null;
  variants_count: number;
  first_image: string | null;
  marketplace_status: Record<string, {
    name: string;
    status: string;
    filled?: number;
    required?: number;
  }>;
}

export interface VariantImage {
  id: number;
  index: number;
  exclude_at_marketplace: boolean;
  url: string | null;
  thumbnail: string | null;
}

export interface VariantSizeDetail {
  id: number;
  size: number;
  size_name: string;
  max_size: number | null;
  max_size_name: string;
  stock: number;
  sku: string;
}

export interface VariantDetail {
  id: number;
  code: string;
  color: number;
  color_name: string;
  color_code: string;
  first_image: string | null;
  images: VariantImage[];
  sizes: VariantSizeDetail[];
}

export interface ProductComposition {
  id: number;
  composition: number;
  composition_name: string;
  value: number;
}

export interface ProductAttribute {
  id: number;
  attribute_group: number;
  attribute_group_name: string;
  data_type: string;
  value_single_attribute: number | null;
  value_single_attribute_name: string | null;
  value_multi_attributes: number[];
  value_multi_attributes_list: { id: number; name: string }[];
  value_int: number | null;
  value_str: string | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  category: number;
  category_name: string;
  category_size_group: number | null;
  brand: number | null;
  brand_name: string | null;
  country: number | null;
  country_name: string | null;
  code: string;
  price: number;
  promo_price: number | null;
  old_price: number | null;
  description: string;
  extra_description: string | null;
  variants: VariantDetail[];
  compositions: ProductComposition[];
  attributes: ProductAttribute[];
}

// Lookup types
export interface LookupItem {
  id: number;
  name: string;
}

export interface LookupColor {
  id: number;
  name: string;
  code: string;
}

export interface LookupCategory {
  id: number;
  name: string;
  level: number;
  parent_id: number | null;
  size_group_id: number | null;
}

export interface LookupSize {
  id: number;
  name: string;
  interpretations: Record<string, string>;
}

export interface LookupAttributeGroup {
  id: number;
  name: string;
  data_type: string;
  required: boolean;
  attributes: { id: number; name: string }[];
}

export interface MarketplaceFormAttribute {
  mp_attribute_id: number;
  external_code: string;
  name: string;
  name_uk: string;
  attr_type: string;
  is_required: boolean;
  is_system?: boolean;
  group_name?: string;
  suffix: string;
  current_value: Record<string, unknown> | null;
  options?: { id: number; code: string; name: string; name_uk: string }[];
}

export interface MarketplaceFormData {
  marketplace: { id: number; name: string };
  category_mapping_id?: number;
  mp_category_name?: string;
  error?: string;
  product_attributes: MarketplaceFormAttribute[];
  brand_attributes: {
    mp_attribute_id: number;
    name: string;
    attr_type: string;
    is_required: boolean;
    auto_value: { entity_id: number; entity_name: string; entity_external_id: string } | null;
    our_brand: string | null;
  }[];
  variants: {
    variant_id: number;
    code: string;
    color_name: string;
    image_url: string | null;
    attributes: MarketplaceFormAttribute[];
    sizes: {
      variant_size_id: number;
      size_name: string;
      sku: string;
      stock: number;
      attributes: MarketplaceFormAttribute[];
    }[];
  }[];
}

export const productAdminAPI = {
  list: (params?: { category?: number; search?: string; brand?: number; page?: number; page_size?: number }) =>
    fetchAPI<PaginatedResponse<ProductListItem>>('/marketplaces/admin-products/', { params }),

  get: (id: number) =>
    fetchAPI<ProductDetail>(`/marketplaces/admin-products/${id}/`),

  marketplaceForm: (productId: number, marketplaceId: number) =>
    fetchAPI<MarketplaceFormData>(`/marketplaces/admin-products/${productId}/marketplace-form/${marketplaceId}/`),

  bulkAiFill: (marketplaceId: number, withImages = false) =>
    fetchAPI<{ task_id: number; status: string }>('/marketplaces/admin-products/bulk-ai-fill/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, with_images: withImages }),
    }),

  bulkAiFillStatus: (taskId: number) =>
    fetchAPI<{
      task_id: number;
      status: string;
      progress: number;
      progress_message: string;
      result: { total: number; filled: number; skipped: number; errors: number; error_details: string[] } | null;
      error: string;
    }>(`/marketplaces/admin-products/bulk-ai-fill-status/${taskId}/`),

  aiFillBase: (productId: number) =>
    fetchAPI<{
      success: boolean;
      data?: {
        description?: string | null;
        compositions?: { composition_id: number; value: number }[] | null;
        our_attributes?: {
          attribute_group_id: number;
          value_single_attribute?: number | null;
          value_multi_attributes?: number[] | null;
          value_int?: number | null;
          value_str?: string | null;
        }[] | null;
        reasoning?: string;
      };
      error?: string;
    }>(`/marketplaces/admin-products/${productId}/ai-fill-base/`, {
      method: 'POST',
    }),

  aiFill: (productId: number, marketplaceId: number, withImages = false) =>
    fetchAPI<{
      success: boolean;
      filled?: Record<string, unknown>;
      reasoning?: string;
      error?: string;
    }>(`/marketplaces/admin-products/${productId}/ai-fill/${marketplaceId}/`, {
      method: 'POST',
      body: JSON.stringify({ with_images: withImages }),
    }),

  saveAttributes: (productId: number, data: {
    marketplace_id: number;
    product_attributes?: Record<string, unknown>[];
    variant_attributes?: Record<string, unknown>[];
    size_attributes?: Record<string, unknown>[];
  }) =>
    fetchAPI<{ success: boolean; saved: number }>(`/marketplaces/admin-products/${productId}/save-attributes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveAll: (productId: number, data: {
    name?: string;
    code?: string;
    category?: number;
    brand?: number;
    country?: number;
    price?: number;
    promo_price?: number;
    old_price?: number;
    description?: string;
    extra_description?: string;
    compositions?: { composition_id: number; value: number }[];
    our_attributes?: {
      attribute_group_id: number;
      value_single_attribute?: number | null;
      value_multi_attributes?: number[];
      value_int?: number | null;
      value_str?: string | null;
    }[];
    variants?: {
      id?: number;
      code?: string;
      color_id?: number;
      sizes?: {
        id?: number;
        size_id?: number;
        max_size_id?: number | null;
        stock?: number;
      }[];
    }[];
    deleted_variant_ids?: number[];
    deleted_size_ids?: number[];
    deleted_image_ids?: number[];
    image_reorders?: { variant_id: number; image_ids: number[] }[];
  }) =>
    fetchAPI<ProductDetail>(`/marketplaces/admin-products/${productId}/save-all/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImage: async (productId: number, variantId: number, file: File): Promise<VariantImage> => {
    const formData = new FormData();
    formData.append('variant_id', String(variantId));
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/marketplaces/admin-products/${productId}/upload-image/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};

// =============================================================================
// Lookups API
// =============================================================================

export const lookupsAPI = {
  brands: () => fetchAPI<LookupItem[]>('/marketplaces/admin-lookups/brands/'),
  countries: () => fetchAPI<LookupItem[]>('/marketplaces/admin-lookups/countries/'),
  colors: () => fetchAPI<LookupColor[]>('/marketplaces/admin-lookups/colors/'),
  categories: () => fetchAPI<LookupCategory[]>('/marketplaces/admin-lookups/categories/'),
  sizes: (sizeGroupId: number) => fetchAPI<LookupSize[]>('/marketplaces/admin-lookups/sizes/', {
    params: { size_group: sizeGroupId },
  }),
  compositions: () => fetchAPI<LookupItem[]>('/marketplaces/admin-lookups/compositions/'),
  attributeGroups: (categoryId: number) =>
    fetchAPI<LookupAttributeGroup[]>('/marketplaces/admin-lookups/attribute-groups/', {
      params: { category: categoryId },
    }),
  aiUsage: () =>
    fetchAPI<{
      total_cost_usd: number;
      total_calls: number;
      total_input_tokens: number;
      total_output_tokens: number;
      by_action: { action: string; cost: number; calls: number }[];
    }>('/marketplaces/admin-lookups/ai-usage/'),
};

// =============================================================================
// Entity Mapping API
// =============================================================================

export interface MarketplaceEntity {
  id: number;
  marketplace: number;
  entity_type: string;
  external_id: string;
  external_code: string;
  name: string;
  name_uk: string | null;
}

export interface EntityMappingItem {
  id: number;
  created_at: string;
  // brand/color/country/size specific fields are dynamic
  [key: string]: unknown;
}

export const entityMappingsAPI = {
  listEntities: (marketplaceId: number, entityType: string, search?: string) =>
    fetchAPI<MarketplaceEntity[]>('/marketplaces/marketplace-entities/', {
      params: { marketplace: marketplaceId, entity_type: entityType, search },
    }),

  brands: {
    list: (marketplaceId: number) =>
      fetchAPI<EntityMappingItem[]>('/marketplaces/brand-mappings/', {
        params: { marketplace: marketplaceId },
      }),
    create: (data: { brand: number; marketplace_entity: number }) =>
      fetchAPI<EntityMappingItem>('/marketplaces/brand-mappings/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI<void>(`/marketplaces/brand-mappings/${id}/`, { method: 'DELETE' }),
    autoMap: (marketplaceId: number) =>
      fetchAPI<{ success: boolean; matched: number }>('/marketplaces/brand-mappings/auto_map/', {
        method: 'POST',
        body: JSON.stringify({ marketplace_id: marketplaceId }),
      }),
    ourBrands: () =>
      fetchAPI<{ id: number; name: string }[]>('/marketplaces/brand-mappings/our_brands/'),
  },

  colors: {
    list: (marketplaceId: number) =>
      fetchAPI<EntityMappingItem[]>('/marketplaces/color-mappings/', {
        params: { marketplace: marketplaceId },
      }),
    create: (data: { color: number; marketplace_entity: number }) =>
      fetchAPI<EntityMappingItem>('/marketplaces/color-mappings/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI<void>(`/marketplaces/color-mappings/${id}/`, { method: 'DELETE' }),
    autoMap: (marketplaceId: number) =>
      fetchAPI<{ success: boolean; matched: number }>('/marketplaces/color-mappings/auto_map/', {
        method: 'POST',
        body: JSON.stringify({ marketplace_id: marketplaceId }),
      }),
    ourColors: () =>
      fetchAPI<{ id: number; name: string; code: string }[]>('/marketplaces/color-mappings/our_colors/'),
  },

  countries: {
    list: (marketplaceId: number) =>
      fetchAPI<EntityMappingItem[]>('/marketplaces/country-mappings/', {
        params: { marketplace: marketplaceId },
      }),
    create: (data: { country: number; marketplace_entity: number }) =>
      fetchAPI<EntityMappingItem>('/marketplaces/country-mappings/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI<void>(`/marketplaces/country-mappings/${id}/`, { method: 'DELETE' }),
    autoMap: (marketplaceId: number) =>
      fetchAPI<{ success: boolean; matched: number }>('/marketplaces/country-mappings/auto_map/', {
        method: 'POST',
        body: JSON.stringify({ marketplace_id: marketplaceId }),
      }),
    ourCountries: () =>
      fetchAPI<{ id: number; name: string }[]>('/marketplaces/country-mappings/our_countries/'),
  },

  sizes: {
    list: (marketplaceId: number) =>
      fetchAPI<EntityMappingItem[]>('/marketplaces/size-mappings/', {
        params: { marketplace: marketplaceId },
      }),
    create: (data: { size: number; marketplace_entity: number }) =>
      fetchAPI<EntityMappingItem>('/marketplaces/size-mappings/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI<void>(`/marketplaces/size-mappings/${id}/`, { method: 'DELETE' }),
    autoMap: (marketplaceId: number) =>
      fetchAPI<{ success: boolean; matched: number }>('/marketplaces/size-mappings/auto_map/', {
        method: 'POST',
        body: JSON.stringify({ marketplace_id: marketplaceId }),
      }),
    ourSizes: () =>
      fetchAPI<{ id: number; name: string }[]>('/marketplaces/size-mappings/our_sizes/'),
  },
};

// =============================================================================
// Export Config API
// =============================================================================

export const exportAPI = {
  full: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/full/`),

  categories: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/categories/`),

  attributeMappings: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/attribute-mappings/`),

  entityMappings: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/entity-mappings/`),

  attributeSets: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/attribute-sets/`),

  products: (marketplaceId: number) =>
    fetchAPI<Record<string, unknown>>(`/marketplaces/export-config/${marketplaceId}/products/`),
};
