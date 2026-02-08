'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplacesAPI, categoriesAPI, aiAPI, type Category, type MarketplaceCategory, type CategoryMapping } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, ArrowLeftRight, Link as LinkIcon, Unlink, Wand2, Check, Sparkles, Bot, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesMappingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CategoriesMappingContent />
    </Suspense>
  );
}

function CategoriesMappingContent() {
  const searchParams = useSearchParams();
  const marketplaceParam = searchParams.get('marketplace');

  const [selectedMarketplace, setSelectedMarketplace] = useState<number | null>(
    marketplaceParam ? Number(marketplaceParam) : null
  );
  const [selectedOurCategory, setSelectedOurCategory] = useState<number | null>(null);
  const [selectedMpCategories, setSelectedMpCategories] = useState<Set<number>>(new Set());
  const [aiStatus, setAiStatus] = useState<{ available: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();

  // Set marketplace from URL param
  useEffect(() => {
    if (marketplaceParam) {
      setSelectedMarketplace(Number(marketplaceParam));
    }
  }, [marketplaceParam]);

  // Check AI status
  useEffect(() => {
    aiAPI.status().then(setAiStatus).catch(() => setAiStatus({ available: false, message: 'AI недоступен' }));
  }, []);

  // Fetch marketplaces
  const { data: marketplaces } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
  });

  // Get current marketplace
  const currentMarketplace = marketplaces?.find(m => m.id === selectedMarketplace);

  // Fetch our categories
  const { data: ourCategories } = useQuery({
    queryKey: ['our-categories'],
    queryFn: categoriesAPI.listOur,
  });

  // Fetch marketplace category tree when marketplace selected
  const { data: mpCategoryTree } = useQuery({
    queryKey: ['mp-category-tree', selectedMarketplace],
    queryFn: () => categoriesAPI.tree(selectedMarketplace!),
    enabled: !!selectedMarketplace,
  });

  // Fetch existing mappings
  const { data: mappings, refetch: refetchMappings } = useQuery({
    queryKey: ['category-mappings', selectedMarketplace],
    queryFn: () => categoriesAPI.listMappings({ marketplace: selectedMarketplace! }),
    enabled: !!selectedMarketplace,
  });

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: (data: { category_id: number; marketplace_category_id: number }) =>
      categoriesAPI.createMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
    },
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: (id: number) => categoriesAPI.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
    },
  });

  // Auto-match mutation
  const autoMatchMutation = useMutation({
    mutationFn: () => categoriesAPI.autoMatch(selectedMarketplace!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      alert(`Автоматически связано ${data.matched} категорий по названию`);
    },
  });

  // Get all mappings for our category (one-to-many)
  const getMappingsForCategory = (categoryId: number): CategoryMapping[] => {
    return mappings?.filter((m) => m.category === categoryId) || [];
  };

  // Get mappings for marketplace category
  const getMappingsForMpCategory = (mpCategoryId: number): CategoryMapping[] => {
    return mappings?.filter((m) => m.marketplace_category === mpCategoryId) || [];
  };

  // Handle select marketplace category (allow multiple)
  const toggleMpCategorySelection = (catId: number) => {
    setSelectedMpCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Handle create mappings (multiple)
  const handleCreateMappings = async () => {
    if (!selectedOurCategory || selectedMpCategories.size === 0) return;

    for (const mpCatId of selectedMpCategories) {
      await createMappingMutation.mutateAsync({
        category_id: selectedOurCategory,
        marketplace_category_id: mpCatId,
      });
    }

    setSelectedOurCategory(null);
    setSelectedMpCategories(new Set());
    refetchMappings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {currentMarketplace && (
              <>
                <Link href="/marketplaces" className="hover:underline">Маркетплейсы</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/marketplaces/${currentMarketplace.id}`} className="hover:underline">
                  {currentMarketplace.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span>Маппинг категорий</span>
          </div>
          <h1 className="text-3xl font-bold">Маппинг категорий</h1>
          <p className="text-muted-foreground">
            Связывание ваших категорий с категориями маркетплейса
          </p>
        </div>

        {/* Marketplace selector */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedMarketplace?.toString() || ''}
            onValueChange={(v) => setSelectedMarketplace(Number(v))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Маркетплейс" />
            </SelectTrigger>
            <SelectContent>
              {marketplaces?.map((mp) => (
                <SelectItem key={mp.id} value={mp.id.toString()}>
                  {mp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedMarketplace ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            Выберите маркетплейс для настройки маппинга категорий
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => autoMatchMutation.mutate()}
              disabled={autoMatchMutation.isPending}
            >
              {autoMatchMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Авто-маппинг по названию
            </Button>

            {aiStatus?.available && (
              <Button variant="outline" disabled>
                <Bot className="h-4 w-4 mr-2" />
                AI маппинг (скоро)
              </Button>
            )}

            <div className="flex-1" />

            <Badge variant="outline" className="text-sm">
              {mappings?.length || 0} связей
            </Badge>
          </div>

          {/* Two column mapping interface */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
            {/* Our categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ваши категории</CardTitle>
                <CardDescription>
                  {ourCategories?.length || 0} категорий
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-2">
                  <div className="space-y-1">
                    {ourCategories?.map((cat) => {
                      const catMappings = getMappingsForCategory(cat.id);
                      const isSelected = selectedOurCategory === cat.id;
                      const hasMappings = catMappings.length > 0;

                      return (
                        <div
                          key={cat.id}
                          className={`
                            flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors
                            ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                          `}
                          onClick={() => setSelectedOurCategory(isSelected ? null : cat.id)}
                        >
                          <span
                            className="truncate"
                            style={{ paddingLeft: `${(cat.level || 0) * 12}px` }}
                          >
                            {cat.name}
                          </span>
                          {hasMappings && (
                            <Badge
                              variant={isSelected ? 'secondary' : 'outline'}
                              className="ml-2 shrink-0"
                            >
                              {catMappings.length}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Arrow and action button */}
            <div className="flex flex-col items-center justify-center gap-4 px-2">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />

              {selectedOurCategory && selectedMpCategories.size > 0 && (
                <Button
                  onClick={handleCreateMappings}
                  disabled={createMappingMutation.isPending}
                  className="whitespace-nowrap"
                >
                  {createMappingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4 mr-2" />
                  )}
                  Связать ({selectedMpCategories.size})
                </Button>
              )}
            </div>

            {/* Marketplace categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Категории {currentMarketplace?.name}</CardTitle>
                <CardDescription>
                  Выберите одну или несколько категорий
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-2">
                  {mpCategoryTree && mpCategoryTree.length > 0 ? (
                    <MarketplaceCategoryTree
                      categories={mpCategoryTree}
                      selectedIds={selectedMpCategories}
                      onToggle={toggleMpCategorySelection}
                      getMappings={getMappingsForMpCategory}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Категории не загружены
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Current mappings for selected category */}
          {selectedOurCategory && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Связи для: {ourCategories?.find(c => c.id === selectedOurCategory)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getMappingsForCategory(selectedOurCategory).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {getMappingsForCategory(selectedOurCategory).map((mapping) => (
                      <Badge
                        key={mapping.id}
                        variant="secondary"
                        className="flex items-center gap-2 py-1.5 px-3"
                      >
                        {mapping.marketplace_category_name}
                        <button
                          onClick={() => deleteMappingMutation.mutate(mapping.id)}
                          className="hover:text-destructive"
                          disabled={deleteMappingMutation.isPending}
                        >
                          <Unlink className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Нет связей. Выберите категории справа и нажмите &quot;Связать&quot;.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* All mappings table */}
          {mappings && mappings.length > 0 && !selectedOurCategory && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Все связи ({mappings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {/* Group by our category */}
                  {Array.from(new Set(mappings.map(m => m.category))).map(catId => {
                    const catMappings = mappings.filter(m => m.category === catId);
                    const catName = catMappings[0]?.category_name;

                    return (
                      <div key={catId} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted">
                        <span className="font-medium min-w-[200px]">{catName}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {catMappings.map(mapping => (
                            <Badge
                              key={mapping.id}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {mapping.marketplace_category_name}
                              <button
                                onClick={() => deleteMappingMutation.mutate(mapping.id)}
                                className="hover:text-destructive ml-1"
                              >
                                <Unlink className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MarketplaceCategoryTree({
  categories,
  level = 0,
  selectedIds,
  onToggle,
  getMappings,
}: {
  categories: MarketplaceCategory[];
  level?: number;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  getMappings: (id: number) => CategoryMapping[];
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ul className={level > 0 ? 'ml-3 border-l border-border pl-2' : ''}>
      {categories.map((cat) => {
        const isExpanded = expanded.has(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;
        const isSelected = selectedIds.has(cat.id);
        const catMappings = getMappings(cat.id);
        const hasMappings = catMappings.length > 0;

        return (
          <li key={cat.id} className="py-0.5">
            <div
              className={`
                flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors
                ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
              `}
              onClick={() => onToggle(cat.id)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(cat.id, e)}
                  className="p-0.5 hover:bg-muted/50 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-5" />
              )}

              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                )
              ) : (
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              )}

              <span className="truncate ml-1">{cat.name}</span>

              {hasMappings && (
                <Badge variant={isSelected ? 'secondary' : 'outline'} className="ml-auto shrink-0 text-xs">
                  {catMappings.length}
                </Badge>
              )}

              {isSelected && !hasMappings && (
                <Check className="h-4 w-4 ml-auto shrink-0" />
              )}
            </div>

            {hasChildren && isExpanded && (
              <MarketplaceCategoryTree
                categories={cat.children!}
                level={level + 1}
                selectedIds={selectedIds}
                onToggle={onToggle}
                getMappings={getMappings}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
