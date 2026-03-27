'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { marketplacesAPI, categoriesAPI, aiAPI, type MarketplaceCategory, type CategoryMapping, type Category, type PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Loader2, Wand2, Check, Bot, ArrowRight, Search, CheckCircle2, Circle, Link as LinkIcon, Unlink, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface AISuggestion {
  our_id: number;
  our_name: string;
  mp_id: number;
  mp_name: string;
  confidence: number;
  reason: string;
}

export default function MappingsPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [aiStatus, setAiStatus] = useState<{ available: boolean; message: string } | null>(null);

  // Check AI status
  useEffect(() => {
    aiAPI.status().then(setAiStatus).catch(() => setAiStatus({ available: false, message: 'AI недоступен' }));
  }, []);

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ['marketplace', id],
    queryFn: () => marketplacesAPI.get(id),
    enabled: !!id,
  });

  const { data: categoryTree } = useQuery({
    queryKey: ['marketplace-category-tree', id],
    queryFn: () => categoriesAPI.tree(id),
    enabled: !!id,
  });

  const { data: mappings, refetch: refetchMappings } = useQuery({
    queryKey: ['category-mappings', id],
    queryFn: () => categoriesAPI.listMappings({ marketplace: id }),
    enabled: !!id,
  });

  const { data: ourCategories } = useQuery({
    queryKey: ['our-categories'],
    queryFn: categoriesAPI.listOur,
    enabled: !!id,
  });

  const createMappingMutation = useMutation({
    mutationFn: (data: { category_id: number; marketplace_category_id: number }) =>
      categoriesAPI.createMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId: number) => categoriesAPI.deleteMapping(mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
    },
  });

  const autoMatchMutation = useMutation({
    mutationFn: () => categoriesAPI.autoMatch(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] });
      alert(`Автоматически связано ${data.matched} категорий по названию`);
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: () => categoriesAPI.cleanupUnmapped(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-category-tree'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-categories-search-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', id] });
      alert(`Видалено ${data.deleted} незамаплених категорій. Залишилось: ${data.remaining}`);
    },
  });

  // AI Assistant
  const [showAi, setShowAi] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ message: string; created_categories: number; created_mappings: number; errors: string[] } | null>(null)

  const handleAiAssistant = async () => {
    const prompt = aiPrompt.trim() || `Найди в интернете категории маркетплейса ${marketplace?.name || ''} которые соответствуют нашим категориям одежды и аксессуаров. Создай категории маркетплейса с правильными external_id/external_code и замапь с нашими.`
    setAiLoading(true)
    setAiResult(null)
    try {
      const res = await categoriesAPI.aiAssistant(id, prompt)
      setAiResult(res)
      if (res.created_categories > 0 || res.created_mappings > 0) {
        queryClient.invalidateQueries({ queryKey: ['category-mappings'] })
        queryClient.invalidateQueries({ queryKey: ['marketplace-category-tree'] })
        queryClient.invalidateQueries({ queryKey: ['marketplace-categories-search-mappings'] })
      }
    } catch (e: unknown) {
      setAiResult({ message: e instanceof Error ? e.message : 'Ошибка', created_categories: 0, created_mappings: 0, errors: [] })
    } finally {
      setAiLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!marketplace) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Маркетплейс не найден</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Assistant */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setShowAi(!showAi)}
          className="w-full flex items-center justify-between p-4"
        >
          <span className="font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-500" />
            AI помощник по категориям
          </span>
          {showAi ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>
        {showAi && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-slate-500">
              AI найдёт категории маркетплейса в интернете, создаст их и замапит с нашими. Можно уточнить задачу в поле ниже.
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tree = (ourCategories || []).map(c =>
                      '\u00A0\u00A0'.repeat(c.level) + `[id=${c.id}] ${c.name}`
                    ).join('\n')
                    setAiPrompt(prev => {
                      const base = prev || `Найди категории ${marketplace?.name || 'маркетплейса'} и замапь с нашими. ОБЯЗАТЕЛЬНО укажи реальные ID категорий маркетплейса в external_id и external_code (числовые коды с сайта/API маркетплейса):`
                      return `${base}\n\nНаши категории:\n${tree}`
                    })
                  }}
                  className="text-xs"
                >
                  Вставить наши категории
                </Button>
              </div>
              <div className="flex items-start gap-3">
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder={`Найди категории ${marketplace?.name || 'маркетплейса'} для женской одежды и аксессуаров и замапь с нашими...`}
                  className="flex-1 h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleAiAssistant}
                  disabled={aiLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                >
                  {aiLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Bot className="mr-2 h-3 w-3" />}
                  Найти и замапить
                </Button>
              </div>
            </div>
            {aiResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  {aiResult.created_categories > 0 && <span className="text-emerald-600 font-medium">+{aiResult.created_categories} категорий</span>}
                  {aiResult.created_mappings > 0 && <span className="text-indigo-600 font-medium">+{aiResult.created_mappings} маппингов</span>}
                  {aiResult.errors.length > 0 && <span className="text-red-500">{aiResult.errors.length} ошибок</span>}
                </div>
                {aiResult.message && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800 whitespace-pre-wrap">
                    {aiResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    <CategoryMappingTab
      marketplace={marketplace}
      mappings={mappings || []}
      ourCategories={ourCategories || []}
      categoryTree={categoryTree || []}
      aiStatus={aiStatus}
      onCreateMapping={async (ourId, mpId) => {
        await createMappingMutation.mutateAsync({
          category_id: ourId,
          marketplace_category_id: mpId,
        });
        refetchMappings();
      }}
      onDeleteMapping={async (id) => {
        await deleteMappingMutation.mutateAsync(id);
      }}
      onAutoMatch={async () => {
        const result = await autoMatchMutation.mutateAsync();
        return result.matched;
      }}
      onCleanupUnmapped={async () => {
        const result = await cleanupMutation.mutateAsync();
        return result.deleted;
      }}
      isCreating={createMappingMutation.isPending}
      isDeleting={deleteMappingMutation.isPending}
      isCleaning={cleanupMutation.isPending}
    />
    </div>
  );
}

function CategoryMappingTab({
  marketplace,
  mappings,
  ourCategories,
  categoryTree,
  aiStatus,
  onCreateMapping,
  onDeleteMapping,
  onAutoMatch,
  onCleanupUnmapped,
  isCreating,
  isDeleting,
  isCleaning,
}: {
  marketplace: { id: number; name: string };
  mappings: CategoryMapping[];
  ourCategories: Category[];
  categoryTree: MarketplaceCategory[];
  aiStatus: { available: boolean; message: string } | null;
  onCreateMapping: (ourId: number, mpId: number) => Promise<void>;
  onDeleteMapping: (id: number) => Promise<void>;
  onAutoMatch: () => Promise<number>;
  onCleanupUnmapped: () => Promise<number>;
  isCreating: boolean;
  isDeleting: boolean;
  isCleaning: boolean;
}) {
  const [selectedOurCategories, setSelectedOurCategories] = useState<Set<number>>(new Set());
  const [selectedMpCategories, setSelectedMpCategories] = useState<Set<number>>(new Set());
  const [ourSearch, setOurSearch] = useState('');
  const [mpSearch, setMpSearch] = useState('');
  const [debouncedMpSearch, setDebouncedMpSearch] = useState('');
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [isAIMatching, setIsAIMatching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  // Debounce marketplace search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMpSearch(mpSearch), 300);
    return () => clearTimeout(timer);
  }, [mpSearch]);

  // Server-side search for marketplace categories
  const {
    data: mpSearchResults,
    isLoading: isMpSearching,
    fetchNextPage: fetchNextMpPage,
    hasNextPage: hasNextMpPage,
    isFetchingNextPage: isFetchingNextMpPage,
  } = useInfiniteQuery({
    queryKey: ['marketplace-categories-search-mappings', marketplace.id, debouncedMpSearch],
    queryFn: ({ pageParam = 1 }) =>
      categoriesAPI.listFlat(marketplace.id, {
        search: debouncedMpSearch,
        page: pageParam,
        page_size: 50,
        leaf_only: false,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<MarketplaceCategory>) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
    initialPageParam: 1,
    enabled: !!debouncedMpSearch,
  });

  const flatMpSearchResults = mpSearchResults?.pages.flatMap((page) => page.results) ?? [];
  const totalMpSearchResults = mpSearchResults?.pages[0]?.count ?? 0;

  // Mapped category IDs
  const mappedOurCategoryIds = new Set(mappings.map(m => m.category));
  const mappedMpCategoryIds = new Set(mappings.map(m => m.marketplace_category));

  // Filter unmapped categories
  const unmappedOurCategories = ourCategories.filter(cat => !mappedOurCategoryIds.has(cat.id));

  // Search filter for our categories
  const filteredOurCategories = ourSearch
    ? unmappedOurCategories.filter(cat => cat.name.toLowerCase().includes(ourSearch.toLowerCase()))
    : unmappedOurCategories;

  // Toggle selection
  const toggleOurCategory = (id: number) => {
    setSelectedOurCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 1 && selectedMpCategories.size > 1) {
          setSelectedMpCategories(new Set([Array.from(selectedMpCategories)[0]]));
        }
        next.add(id);
      }
      return next;
    });
  };

  const toggleMpCategory = (id: number) => {
    if (selectedOurCategories.size > 1 && !selectedMpCategories.has(id)) {
      setSelectedMpCategories(new Set([id]));
      return;
    }
    setSelectedMpCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 1 && selectedOurCategories.size > 1) {
          setSelectedOurCategories(new Set([Array.from(selectedOurCategories)[0]]));
        }
        next.add(id);
      }
      return next;
    });
  };

  // Create mappings
  const handleCreateMappings = async () => {
    const ourIds = Array.from(selectedOurCategories);
    const mpIds = Array.from(selectedMpCategories);

    if (ourIds.length > 1 && mpIds.length === 1) {
      for (const ourId of ourIds) {
        await onCreateMapping(ourId, mpIds[0]);
      }
    } else if (ourIds.length === 1 && mpIds.length >= 1) {
      for (const mpId of mpIds) {
        await onCreateMapping(ourIds[0], mpId);
      }
    }

    setSelectedOurCategories(new Set());
    setSelectedMpCategories(new Set());
  };

  // Cleanup unmapped categories
  const handleCleanupUnmapped = async () => {
    if (!confirm('Видалити всі незамаплені категорії маркетплейса? Залишаться тільки замаплені та їх батьківські категорії.')) return;
    await onCleanupUnmapped();
  };

  // Auto match by name
  const handleAutoMatch = async () => {
    setIsAutoMatching(true);
    try {
      const matched = await onAutoMatch();
      alert(`Автоматично зв'язано ${matched} категорій за назвою`);
    } finally {
      setIsAutoMatching(false);
    }
  };

  // AI mapping
  const handleAIMapping = async () => {
    setIsAIMatching(true);
    setAiSuggestions(null);
    try {
      const result = await aiAPI.suggestCategoryMappings(marketplace.id);
      if (result.success && result.suggestions) {
        setAiSuggestions(result.suggestions);
        setSelectedSuggestions(new Set(result.suggestions.map((_, i) => i)));
      } else {
        alert(result.error || result.message || 'Помилка AI маппінгу');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setIsAIMatching(false);
    }
  };

  // Apply selected AI suggestions
  const handleApplySuggestions = async () => {
    if (!aiSuggestions) return;
    const toApply = aiSuggestions.filter((_, i) => selectedSuggestions.has(i));
    for (const s of toApply) {
      await onCreateMapping(s.our_id, s.mp_id);
    }
    setAiSuggestions(null);
    setSelectedSuggestions(new Set());
  };

  const canCreateMapping = selectedOurCategories.size > 0 && selectedMpCategories.size > 0;

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoMatch}
          disabled={isAutoMatching}
          className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
        >
          {isAutoMatching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5 text-amber-500" />}
          Авто за назвою
        </Button>

        {aiStatus?.available && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIMapping}
            disabled={isAIMatching}
            className="border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
          >
            {isAIMatching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Bot className="h-4 w-4 mr-1.5 text-violet-500" />}
            AI маппінг
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCleanupUnmapped}
          disabled={isCleaning}
          className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          {isCleaning ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5 text-red-500" />}
          Видалити зайві
        </Button>

        <div className="flex-1" />

        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {mappings.length} зв&apos;язків
        </Badge>
        <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
          <Circle className="h-3 w-3 mr-1" />
          {unmappedOurCategories.length} незв&apos;язаних
        </Badge>
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-100 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-800">AI знайшов {aiSuggestions.length} відповідностей</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setAiSuggestions(null)} className="h-7 text-xs">
                Скасувати
              </Button>
              <Button size="sm" onClick={handleApplySuggestions} disabled={selectedSuggestions.size === 0} className="h-7 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Застосувати ({selectedSuggestions.size})
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-2 space-y-1">
              {aiSuggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSuggestions(prev => {
                      const next = new Set(prev);
                      if (next.has(idx)) next.delete(idx);
                      else next.add(idx);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    selectedSuggestions.has(idx) ? 'bg-blue-200' : 'bg-white hover:bg-blue-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedSuggestions.has(idx) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedSuggestions.has(idx) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="font-medium text-sm flex-1 min-w-0 truncate">{s.our_name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 min-w-0 truncate">{s.mp_name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {Math.round(s.confidence * 100)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 max-w-[150px] truncate" title={s.reason}>
                    {s.reason}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Existing mappings table */}
      {mappings.length > 0 && (
        <div className="border rounded-lg overflow-hidden border-green-200">
          <div className="px-3 py-2 bg-green-50 border-b border-green-200 text-sm font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-green-600" />
            <span className="text-green-800">Існуючі зв&apos;язки</span>
          </div>
          <ScrollArea className="h-[280px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Наша категорія</th>
                  <th className="text-center px-2 py-2 w-12"></th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Категорія {marketplace.name}</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, idx) => (
                  <tr key={m.id} className={`border-b last:border-b-0 hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-800">{m.category_name}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <ArrowRight className="h-4 w-4 inline text-green-500" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-amber-500" />
                        <span className="text-gray-700">{m.marketplace_category_name}</span>
                      </div>
                    </td>
                    <td className="px-2">
                      <button
                        onClick={() => onDeleteMapping(m.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                        disabled={isDeleting}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      )}

      {/* Manual mapping interface */}
      <div className="grid grid-cols-2 gap-3" style={{ minHeight: '350px' }}>
        {/* Our categories */}
        <div className="border rounded-lg overflow-hidden flex flex-col border-blue-200">
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium flex-1 text-blue-800">Наші категорії</span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400" />
              <Input
                placeholder="Пошук..."
                value={ourSearch}
                onChange={(e) => setOurSearch(e.target.value)}
                className="pl-7 w-[140px] h-7 text-xs border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 bg-white">
            <div className="p-1">
              {filteredOurCategories.length > 0 ? (
                filteredOurCategories.map((cat) => {
                  const isSelected = selectedOurCategories.has(cat.id);
                  const hasChildren = cat.level === 0;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleOurCategory(cat.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-blue-50 text-gray-700'
                      }`}
                      style={{ paddingLeft: `${8 + (cat.level || 0) * 16}px` }}
                    >
                      {hasChildren ? (
                        <FolderOpen className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-200' : 'text-blue-500'}`} />
                      ) : (
                        <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-200' : 'text-blue-400'}`} />
                      )}
                      <span className="truncate flex-1">{cat.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {ourSearch ? 'Не знайдено' : 'Всі категорії зв\'язані'}
                </div>
              )}
            </div>
          </ScrollArea>
          {selectedOurCategories.size > 0 && (
            <div className="px-3 py-1.5 bg-blue-100 border-t border-blue-200 text-xs text-blue-700 font-medium">
              Обрано: {selectedOurCategories.size}
            </div>
          )}
        </div>

        {/* Marketplace categories */}
        <div className="border rounded-lg overflow-hidden flex flex-col border-amber-200">
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <Folder className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium flex-1 text-amber-800">Категорії {marketplace.name}</span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-400" />
              <Input
                placeholder="Пошук..."
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                className="pl-7 w-[140px] h-7 text-xs border-amber-200 focus:border-amber-400"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 bg-white">
            {debouncedMpSearch ? (
              // Server-side search results
              <div className="p-1">
                {isMpSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : flatMpSearchResults.length > 0 ? (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                      Знайдено: {totalMpSearchResults}
                    </div>
                    {flatMpSearchResults.map((cat) => {
                      const isSelected = selectedMpCategories.has(cat.id);
                      const isHidden = mappedMpCategoryIds.has(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            isHidden
                              ? 'opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-amber-500 text-white'
                              : 'hover:bg-amber-50 text-gray-700'
                          }`}
                          onClick={() => !isHidden && toggleMpCategory(cat.id)}
                        >
                          <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-amber-200' : 'text-amber-400'}`} />
                          <span className="truncate flex-1">{cat.name}</span>
                          {cat.external_code && (
                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                              {cat.external_code}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                    {hasNextMpPage && (
                      <div className="flex justify-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchNextMpPage()}
                          disabled={isFetchingNextMpPage}
                          className="text-xs h-7"
                        >
                          {isFetchingNextMpPage ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : null}
                          Завантажити ще
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Не знайдено
                  </div>
                )}
              </div>
            ) : categoryTree.length > 0 ? (
              // Tree view (no search)
              <div className="p-1">
                <MappingCategoryTreeCompact
                  categories={categoryTree}
                  selectedIds={selectedMpCategories}
                  onToggle={toggleMpCategory}
                  hiddenIds={mappedMpCategoryIds}
                  searchQuery=""
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Синхронізуйте категорії
              </div>
            )}
          </ScrollArea>
          {selectedMpCategories.size > 0 && (
            <div className="px-3 py-1.5 bg-amber-100 border-t border-amber-200 text-xs text-amber-700 font-medium">
              Обрано: {selectedMpCategories.size}
            </div>
          )}
        </div>
      </div>

      {/* Create mapping button */}
      {canCreateMapping && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleCreateMappings}
            disabled={isCreating}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-700 hover:to-amber-600 text-white shadow-md"
          >
            {isCreating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <LinkIcon className="h-5 w-5 mr-2" />}
            Зв&apos;язати ({selectedOurCategories.size} → {selectedMpCategories.size})
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact tree for mapping tab
function MappingCategoryTreeCompact({
  categories,
  selectedIds,
  onToggle,
  hiddenIds,
  searchQuery,
  level = 0,
}: {
  categories: MarketplaceCategory[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  hiddenIds: Set<number>;
  searchQuery: string;
  level?: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const matchesSearch = (cat: MarketplaceCategory): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (cat.name.toLowerCase().includes(q)) return true;
    if (cat.children?.some(c => matchesSearch(c))) return true;
    return false;
  };

  const hasVisibleChildren = (cat: MarketplaceCategory): boolean => {
    if (!cat.children?.length) return false;
    return cat.children.some(c => (!hiddenIds.has(c.id) || hasVisibleChildren(c)) && matchesSearch(c));
  };

  const visibleCategories = categories.filter(cat =>
    ((!hiddenIds.has(cat.id) || hasVisibleChildren(cat)) && matchesSearch(cat))
  );

  if (!visibleCategories.length && level === 0) {
    return <div className="text-center py-4 text-muted-foreground text-sm">Всі зв&apos;язані</div>;
  }

  return (
    <>
      {visibleCategories.map((cat) => {
        const isExpanded = expanded.has(cat.id) || !!searchQuery;
        const hasChildren = cat.children && cat.children.length > 0;
        const isSelected = selectedIds.has(cat.id);
        const isHidden = hiddenIds.has(cat.id);

        return (
          <div key={cat.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                isHidden
                  ? 'opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-amber-50 text-gray-700'
              }`}
              style={{ paddingLeft: `${8 + level * 16}px` }}
              onClick={() => !isHidden && onToggle(cat.id)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(prev => {
                      const next = new Set(prev);
                      if (next.has(cat.id)) next.delete(cat.id);
                      else next.add(cat.id);
                      return next;
                    });
                  }}
                  className="p-0.5"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              {hasChildren ? (
                <FolderOpen className={`h-4 w-4 shrink-0 ${isSelected ? 'text-amber-200' : 'text-amber-500'}`} />
              ) : (
                <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-amber-200' : 'text-amber-400'}`} />
              )}
              <span className="truncate flex-1">{cat.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
            </div>
            {hasChildren && isExpanded && (
              <MappingCategoryTreeCompact
                categories={cat.children!}
                selectedIds={selectedIds}
                onToggle={onToggle}
                hiddenIds={hiddenIds}
                searchQuery={searchQuery}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
