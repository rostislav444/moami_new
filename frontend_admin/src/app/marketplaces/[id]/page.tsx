'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { categoriesAPI, attributesAPI, aiAPI, type MarketplaceCategory, type AIDiscoveredAttribute, type PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Loader2, Upload, FileSpreadsheet, Save, Plus, Trash2, Search, CheckCircle2, Circle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

const PAGE_SIZE = 50;

export default function CategoriesPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(categorySearch), 300);
    return () => clearTimeout(timer);
  }, [categorySearch]);

  // Root categories (lazy tree)
  const { data: rootCategories, isLoading } = useQuery({
    queryKey: ['marketplace-category-tree', id],
    queryFn: () => categoriesAPI.tree(id),
    enabled: !!id && !debouncedSearch,
  });

  // Search with infinite scroll
  const {
    data: searchResults,
    isLoading: isSearching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['marketplace-categories-search', id, debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      categoriesAPI.listFlat(id, {
        search: debouncedSearch,
        page: pageParam,
        page_size: PAGE_SIZE,
        leaf_only: false,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
    enabled: !!id && !!debouncedSearch,
  });

  const { data: attributeSets } = useQuery({
    queryKey: ['attribute-sets', id],
    queryFn: () => attributesAPI.listSets(id),
    enabled: !!id,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; external_code?: string; parent?: number | null }) =>
      categoriesAPI.createMarketplaceCategory({ marketplace: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories', id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-category-tree', id] });
      setShowCreateCategoryModal(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => categoriesAPI.deleteMarketplaceCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories', id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-category-tree', id] });
      setSelectedCategory(null);
    },
  });

  const moveCategoryMutation = useMutation({
    mutationFn: ({ categoryId, parentId }: { categoryId: number; parentId: number | null }) =>
      categoriesAPI.moveMarketplaceCategory(categoryId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories', id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-category-tree', id] });
    },
  });

  // Flatten search results from infinite query
  const flatSearchResults = searchResults?.pages.flatMap((page) => page.results) ?? [];
  const totalSearchResults = searchResults?.pages[0]?.count ?? 0;

  const showTree = !debouncedSearch;
  const showSearchResults = !!debouncedSearch;

  if (isLoading && !debouncedSearch) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-3 py-1.5 bg-muted/30">
          <span className="text-sm font-medium">Категории маркетплейса</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-7 w-[200px] h-7 text-sm"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button size="sm" className="h-7 text-xs" onClick={() => setShowCreateCategoryModal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/50 border-y border-border text-xs font-medium text-muted-foreground">
          <div className="shrink-0 w-5" />
          <span className="flex-1">Название</span>
          <span className="shrink-0 w-24 text-center">Код</span>
          <span className="shrink-0 w-28 text-center">Атрибуты</span>
          <span className="shrink-0 w-8" />
        </div>

        {/* Tree view (when not searching) */}
        {showTree && (
          <ScrollArea className="h-[500px]">
            {rootCategories && rootCategories.length > 0 ? (
              <LazyTreeView
                categories={rootCategories}
                onSelectCategory={setSelectedCategory}
                selectedId={selectedCategory?.id}
                onDeleteCategory={(cat) => {
                  if (confirm(`Удалить категорию "${cat.name}"? Это также удалит все дочерние категории.`)) {
                    deleteCategoryMutation.mutate(cat.id);
                  }
                }}
                attributeSets={attributeSets || []}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Категории не загружены
              </div>
            )}
          </ScrollArea>
        )}

        {/* Search results (when searching) */}
        {showSearchResults && (
          <div className="h-[500px] overflow-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : flatSearchResults.length > 0 ? (
              <>
                <div className="px-4 py-1.5 text-xs text-muted-foreground border-b">
                  Найдено: {totalSearchResults} категорий
                </div>
                {flatSearchResults.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    level={0}
                    onSelect={setSelectedCategory}
                    isSelected={selectedCategory?.id === cat.id}
                    onDelete={(cat) => {
                      if (confirm(`Удалить категорию "${cat.name}"?`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    attributeSets={attributeSets || []}
                    showExpandIcon={false}
                  />
                ))}
                {hasNextPage && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        'Загрузить ещё'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Категории не найдены
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Attributes Modal */}
      <CategoryAttributesModal
        category={selectedCategory}
        marketplaceId={id}
        onClose={() => setSelectedCategory(null)}
        allCategories={rootCategories || []}
        onMoveCategory={(cat, newParentId) => {
          moveCategoryMutation.mutate({ categoryId: cat.id, parentId: newParentId });
        }}
        onDeleteCategory={(cat) => {
          deleteCategoryMutation.mutate(cat.id);
        }}
      />

      {/* Create Category Modal */}
      <CreateCategoryModal
        open={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onCreate={(data) => createCategoryMutation.mutate(data)}
        isPending={createCategoryMutation.isPending}
        categories={rootCategories || []}
      />
    </div>
  );
}

// Lazy loading tree view
function LazyTreeView({
  categories,
  onSelectCategory,
  selectedId,
  onDeleteCategory,
  attributeSets,
}: {
  categories: MarketplaceCategory[];
  onSelectCategory: (cat: MarketplaceCategory) => void;
  selectedId?: number;
  onDeleteCategory?: (cat: MarketplaceCategory) => void;
  attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }>;
}) {
  return (
    <div>
      {categories.map((cat) => (
        <LazyTreeNode
          key={cat.id}
          category={cat}
          level={0}
          onSelect={onSelectCategory}
          selectedId={selectedId}
          onDelete={onDeleteCategory}
          attributeSets={attributeSets}
        />
      ))}
    </div>
  );
}

// Lazy tree node - loads children on expand
function LazyTreeNode({
  category,
  level,
  onSelect,
  selectedId,
  onDelete,
  attributeSets,
}: {
  category: MarketplaceCategory;
  level: number;
  onSelect: (cat: MarketplaceCategory) => void;
  selectedId?: number;
  onDelete?: (cat: MarketplaceCategory) => void;
  attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.has_children;

  // Lazy load children
  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['marketplace-category-children', category.id],
    queryFn: () => categoriesAPI.getChildren(category.id),
    enabled: isExpanded && hasChildren,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <CategoryRow
        category={category}
        level={level}
        onSelect={onSelect}
        isSelected={selectedId === category.id}
        onDelete={onDelete}
        attributeSets={attributeSets}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        isLoading={childrenLoading}
        showExpandIcon={hasChildren}
      />

      {isExpanded && hasChildren && (
        <>
          {childrenLoading ? (
            <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${16 + (level + 1) * 24}px` }}>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            children?.map((child) => (
              <LazyTreeNode
                key={child.id}
                category={child}
                level={level + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                onDelete={onDelete}
                attributeSets={attributeSets}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

// Category row component
function CategoryRow({
  category,
  level,
  onSelect,
  isSelected,
  onDelete,
  attributeSets,
  isExpanded,
  onToggle,
  isLoading,
  showExpandIcon,
}: {
  category: MarketplaceCategory;
  level: number;
  onSelect: (cat: MarketplaceCategory) => void;
  isSelected: boolean;
  onDelete?: (cat: MarketplaceCategory) => void;
  attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }>;
  isExpanded?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  isLoading?: boolean;
  showExpandIcon: boolean;
}) {
  const hasChildren = category.has_children;
  const categoriesWithAttributes = new Set(
    attributeSets.filter((s) => s.attributes_count > 0).map((s) => s.external_code)
  );
  const hasAttributes = categoriesWithAttributes.has(category.external_code);
  const attrSet = attributeSets.find((s) => s.external_code === category.external_code);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 border-b border-border cursor-pointer transition-colors group
        hover:bg-muted/50
        ${isSelected ? 'bg-primary/10' : ''}
        ${hasChildren ? 'bg-muted/20' : ''}
      `}
      style={{ paddingLeft: `${16 + level * 24}px` }}
      onClick={() => onSelect(category)}
    >
      <div className="shrink-0 w-5">
        {showExpandIcon ? (
          <button
            onClick={onToggle}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : hasChildren ? (
          <FolderOpen className="h-4 w-4 text-amber-500" />
        ) : (
          <FileText className="h-4 w-4 text-blue-500" />
        )}
      </div>

      <span className={`flex-1 min-w-0 truncate ${hasChildren ? 'font-medium' : ''}`}>
        {category.name}
      </span>

      <span className="text-xs text-muted-foreground font-mono shrink-0 w-24 text-center">
        {category.external_code}
      </span>

      <div className="shrink-0 w-28 flex items-center justify-center">
        {hasAttributes ? (
          <Badge variant="default" className="text-xs bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {attrSet?.attributes_count}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <Circle className="h-3 w-3 mr-1" />
            Нет
          </Badge>
        )}
      </div>

      <div className="shrink-0 w-8 flex justify-end">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded text-muted-foreground hover:text-red-600 transition-opacity"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Helper to flatten categories for parent select
function flattenCategoriesForSelect(
  categories: MarketplaceCategory[],
  level = 0
): Array<{ id: number; name: string; level: number }> {
  const result: Array<{ id: number; name: string; level: number }> = [];
  for (const cat of categories) {
    result.push({ id: cat.id, name: cat.name, level });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategoriesForSelect(cat.children, level + 1));
    }
  }
  return result;
}

function CategoryAttributesModal({
  category,
  marketplaceId,
  onClose,
  onMoveCategory,
  onDeleteCategory,
  allCategories,
}: {
  category: MarketplaceCategory | null;
  marketplaceId: number;
  onClose: () => void;
  onMoveCategory?: (category: MarketplaceCategory, newParentId: number | null) => void;
  onDeleteCategory?: (category: MarketplaceCategory) => void;
  allCategories?: MarketplaceCategory[];
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedAttributes, setParsedAttributes] = useState<AIDiscoveredAttribute[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: attributeSet, refetch: refetchAttributeSet } = useQuery({
    queryKey: ['attribute-set-by-code', marketplaceId, category?.external_code ?? ''],
    queryFn: async () => {
      if (!category) return null;
      const sets = await attributesAPI.listSets(marketplaceId);
      return sets.find((s) => s.external_code === category.external_code) ?? null;
    },
    enabled: !!category && !!marketplaceId,
  });

  const {
    data: setAttributes,
    isLoading,
    refetch: refetchAttributes,
  } = useQuery({
    queryKey: ['set-attributes', attributeSet?.id ?? 0],
    queryFn: () => attributesAPI.getSetAttributes(attributeSet!.id),
    enabled: !!attributeSet && !!attributeSet.id,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setParsedAttributes(null);

    try {
      const result = await aiAPI.parseAttributesFile(file);
      if (result.success && result.attributes) {
        setParsedAttributes(result.attributes);
      } else {
        setError(result.error || 'Ошибка парсинга файла');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveAttributes = async () => {
    if (!parsedAttributes || !category) return;

    setSaving(true);
    setError(null);

    try {
      const result = await aiAPI.saveParsedAttributes(
        marketplaceId,
        category.external_code,
        category.name,
        parsedAttributes
      );

      if (result.success) {
        setParsedAttributes(null);
        queryClient.invalidateQueries({ queryKey: ['attribute-sets', marketplaceId] });
        refetchAttributeSet();
        setTimeout(() => refetchAttributes(), 500);
      } else {
        setError('Ошибка сохранения');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setParsedAttributes(null);
    setError(null);
    onClose();
  };

  const filterOutCategory = (cats: MarketplaceCategory[], excludeId: number): MarketplaceCategory[] => {
    return cats
      .filter((c) => c.id !== excludeId)
      .map((c) => ({
        ...c,
        children: c.children ? filterOutCategory(c.children, excludeId) : undefined,
      }));
  };

  const availableParents =
    category && allCategories ? flattenCategoriesForSelect(filterOutCategory(allCategories, category.id)) : [];

  const currentParentId = category?.parent ? String(category.parent) : '';

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (category && onMoveCategory) {
      const newParentId = e.target.value ? Number(e.target.value) : null;
      onMoveCategory(category, newParentId);
    }
  };

  const handleDelete = () => {
    if (category && onDeleteCategory) {
      if (confirm(`Удалить категорию "${category.name}"? Это также удалит все дочерние категории.`)) {
        onDeleteCategory(category);
      }
    }
  };

  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());
  const toggleAttrExpand = (id: number) => {
    setExpandedAttrs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={!!category} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-amber-500" />
              {category?.name}
            </DialogTitle>
            {onDeleteCategory && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Удалить категорию"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="text-muted-foreground">Код:</span>
                <span className="ml-2 font-mono">{category?.external_code}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span>
                <span className="ml-2 font-mono">{category?.external_id}</span>
              </div>
              {onMoveCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Родитель:</span>
                  <select
                    value={currentParentId}
                    onChange={handleParentChange}
                    className="h-7 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-[300px]"
                  >
                    <option value="">— Корневая категория —</option>
                    {availableParents.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'—'.repeat(cat.level)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {parsedAttributes && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <FileSpreadsheet className="h-4 w-4" />
                  Распознано {parsedAttributes.length} атрибутов
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setParsedAttributes(null)}>
                    Отмена
                  </Button>
                  <Button size="sm" onClick={handleSaveAttributes} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {parsedAttributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                      <span>{attr.name}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {attr.type}
                        </Badge>
                        {attr.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Обяз.
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Атрибуты категории ({setAttributes?.length || 0})</h4>
              {(!setAttributes || setAttributes.length === 0) && !isLoading && !parsedAttributes && (
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Парсинг...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить XLSX
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
            ) : setAttributes && setAttributes.length > 0 ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground border-b bg-muted/30 rounded-t">
                  <div className="w-4 shrink-0" />
                  <span className="flex-1">Название</span>
                  <span className="shrink-0 w-28 text-center">Код</span>
                  <span className="shrink-0 w-20 text-right">Значений</span>
                  <span className="shrink-0 w-24 text-center">Тип</span>
                  <span className="shrink-0 w-14 text-center">Обяз.</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-1 pr-4">
                    {setAttributes.map((attr) => (
                      <div key={attr.id} className="border rounded">
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => attr.options && attr.options.length > 0 && toggleAttrExpand(attr.id)}
                        >
                          {attr.options && attr.options.length > 0 ? (
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${expandedAttrs.has(attr.id) ? 'rotate-90' : ''}`}
                            />
                          ) : (
                            <div className="w-4 shrink-0" />
                          )}
                          <span className="font-medium flex-1 min-w-0 truncate">{attr.name}</span>
                          <span className="text-xs text-muted-foreground font-mono shrink-0 w-28 text-center truncate">
                            {attr.external_code}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                            {attr.options && attr.options.length > 0 ? `${attr.options.length}` : '—'}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0 w-24 justify-center">
                            {attr.attr_type}
                          </Badge>
                          <span className="shrink-0 w-14 text-center">
                            {attr.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Да
                              </Badge>
                            )}
                          </span>
                        </div>
                        {expandedAttrs.has(attr.id) && attr.options && attr.options.length > 0 && (
                          <div className="px-3 pb-3 pt-1 ml-7 border-t bg-muted/30">
                            <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
                              {attr.options.slice(0, 100).map((opt) => (
                                <span
                                  key={opt.id}
                                  className="px-2 py-0.5 bg-white border rounded text-xs"
                                  title={opt.external_code}
                                >
                                  {opt.name}
                                </span>
                              ))}
                              {attr.options.length > 100 && (
                                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                  ...и ещё {attr.options.length - 100}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{attributeSet ? 'Нет атрибутов для этой категории' : 'Набор атрибутов не найден'}</p>
                <p className="text-sm mt-1">Загрузите XLSX с атрибутами</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCategoryModal({
  open,
  onClose,
  onCreate,
  isPending,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; external_code?: string; parent?: number | null }) => void;
  isPending: boolean;
  categories: MarketplaceCategory[];
}) {
  const [name, setName] = useState('');
  const [externalCode, setExternalCode] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      external_code: externalCode.trim() || undefined,
      parent: parentId ? Number(parentId) : null,
    });
  };

  const handleClose = () => {
    setName('');
    setExternalCode('');
    setParentId('');
    onClose();
  };

  const flatCategories = flattenCategoriesForSelect(categories);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать категорию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Женские блузы"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalCode">Внешний код</Label>
            <Input
              id="externalCode"
              value={externalCode}
              onChange={(e) => setExternalCode(e.target.value)}
              placeholder="4637175 (необязательно)"
            />
            <p className="text-xs text-muted-foreground">Если не указан, будет сгенерирован автоматически</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Родительская категория</Label>
            <select
              id="parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Корневая категория —</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'—'.repeat(cat.level)} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
