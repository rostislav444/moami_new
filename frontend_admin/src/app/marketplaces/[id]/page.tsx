'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { categoriesAPI, attributesAPI, marketplacesAPI, type MarketplaceCategory, type PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ChevronRight, ChevronDown, FolderOpen, FileText, Loader2, Plus, Trash2, Search, CheckCircle2, Circle, X, Download, XCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';

const PAGE_SIZE = 50;

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Multi-select for bulk attribute loading
  const [checkedCategories, setCheckedCategories] = useState<Map<number, string>>(new Map());
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const syncAttributesMutation = useMutation({
    mutationFn: (categoryCodes: string[]) => marketplacesAPI.syncAttributes(id, categoryCodes),
    onSuccess: (data) => {
      setSyncResult({ success: true, message: `Загружено ${data.synced} наборов атрибутов` });
      setCheckedCategories(new Map());
      queryClient.invalidateQueries({ queryKey: ['attribute-sets', id] });
      setTimeout(() => setSyncResult(null), 5000);
    },
    onError: (err) => {
      setSyncResult({ success: false, message: err instanceof Error ? err.message : 'Ошибка загрузки' });
      setTimeout(() => setSyncResult(null), 5000);
    },
  });

  const toggleCategory = useCallback((catId: number, externalCode: string) => {
    setCheckedCategories((prev) => {
      const next = new Map(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.set(catId, externalCode);
      }
      return next;
    });
  }, []);

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
          <div className="shrink-0 w-6" />
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
                onSelectCategory={(cat: MarketplaceCategory) => router.push(`/marketplaces/${id}/categories/${cat.id}`)}
                onDeleteCategory={(cat: MarketplaceCategory) => {
                  if (confirm(`Удалить категорию "${cat.name}"? Это также удалит все дочерние категории.`)) {
                    deleteCategoryMutation.mutate(cat.id);
                  }
                }}
                attributeSets={attributeSets || []}
                checkedCategories={checkedCategories}
                onToggleCheck={toggleCategory}
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
                    onSelect={(cat) => router.push(`/marketplaces/${id}/categories/${cat.id}`)}
                    isSelected={false}
                    onDelete={(cat) => {
                      if (confirm(`Удалить категорию "${cat.name}"?`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    attributeSets={attributeSets || []}
                    showExpandIcon={false}
                    isChecked={checkedCategories.has(cat.id)}
                    onToggleCheck={toggleCategory}
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

      {/* Floating action bar */}
      {checkedCategories.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-background border-2 border-primary/20 rounded-xl shadow-2xl">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Выбрано: {checkedCategories.size}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCheckedCategories(new Map())}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Очистить
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const codes = Array.from(checkedCategories.values());
              syncAttributesMutation.mutate(codes);
            }}
            disabled={syncAttributesMutation.isPending}
          >
            {syncAttributesMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Загрузить атрибуты
          </Button>
        </div>
      )}

      {/* Sync result toast */}
      {syncResult && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${
          syncResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {syncResult.success ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {syncResult.message}
        </div>
      )}

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
  onDeleteCategory,
  attributeSets,
  checkedCategories,
  onToggleCheck,
}: {
  categories: MarketplaceCategory[];
  onSelectCategory: (cat: MarketplaceCategory) => void;
  onDeleteCategory?: (cat: MarketplaceCategory) => void;
  attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }>;
  checkedCategories: Map<number, string>;
  onToggleCheck: (id: number, code: string) => void;
}) {
  return (
    <div>
      {categories.map((cat) => (
        <LazyTreeNode
          key={cat.id}
          category={cat}
          level={0}
          onSelect={onSelectCategory}
          onDelete={onDeleteCategory}
          attributeSets={attributeSets}
          checkedCategories={checkedCategories}
          onToggleCheck={onToggleCheck}
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
  onDelete,
  attributeSets,
  checkedCategories,
  onToggleCheck,
}: {
  category: MarketplaceCategory;
  level: number;
  onSelect: (cat: MarketplaceCategory) => void;
  onDelete?: (cat: MarketplaceCategory) => void;
  attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }>;
  checkedCategories: Map<number, string>;
  onToggleCheck: (id: number, code: string) => void;
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
        isSelected={false}
        onDelete={onDelete}
        attributeSets={attributeSets}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        isLoading={childrenLoading}
        showExpandIcon={hasChildren}
        isChecked={checkedCategories.has(category.id)}
        onToggleCheck={onToggleCheck}
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
                onDelete={onDelete}
                attributeSets={attributeSets}
                checkedCategories={checkedCategories}
                onToggleCheck={onToggleCheck}
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
  isChecked,
  onToggleCheck,
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
  isChecked?: boolean;
  onToggleCheck?: (id: number, code: string) => void;
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
        ${isChecked ? 'bg-blue-50' : ''}
        ${hasChildren ? 'bg-muted/20' : ''}
      `}
      style={{ paddingLeft: `${16 + level * 24}px` }}
      onClick={() => onSelect(category)}
    >
      {/* Checkbox */}
      <div className="shrink-0 w-6 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isChecked ?? false}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheck?.(category.id, category.external_code);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
      </div>

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
