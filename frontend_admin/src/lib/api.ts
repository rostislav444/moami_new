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
};

// =============================================================================
// Attributes API
// =============================================================================

export const attributesAPI = {
  listSets: (marketplaceId: number) =>
    fetchAPI<MarketplaceAttributeSet[]>('/marketplaces/attribute-sets/', {
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
    fetchAPI<{ xml: string }>('/marketplaces/feed-templates/preview/', {
      method: 'POST',
      body: JSON.stringify({ marketplace_id: marketplaceId, product_id: productId }),
    }),
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
  parseAttributesFile: async (file: File): Promise<AIDiscoveryResult> => {
    const formData = new FormData();
    formData.append('file', file);

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
