'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { attributesAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ChevronRight, ChevronDown, Layers, Loader2, Search, Trash2, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Color mapping for attribute types
const attrTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  select: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  multiselect: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  string: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  text: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  int: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  float: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  boolean: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  array: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
};

function getAttrTypeStyle(type: string) {
  return attrTypeColors[type] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
}

export default function AttributesPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['attribute-sets', id, page, search],
    queryFn: () => attributesAPI.listSets(id, { page, search: search || undefined }),
    enabled: !!id,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => attributesAPI.deleteAllSets(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-sets', id] });
      setPage(1);
    },
  });

  const handleDeleteSet = async (setId: number) => {
    await fetch(`${API_BASE}/marketplaces/attribute-sets/${setId}/`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ['attribute-sets', id] });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSet = (setId: number) => {
    setExpandedSets(prev => {
      const next = new Set(prev);
      if (next.has(setId)) next.delete(setId);
      else next.add(setId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const attributeSets = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 50);

  if (!totalCount && !search) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Атрибуты не загружены</p>
        <p className="text-sm mt-1">Запустите пайплайн загрузки атрибутов</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with search, stats, delete all */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по наборам..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        {searchInput !== search && (
          <Button size="sm" variant="outline" onClick={handleSearch}>
            Найти
          </Button>
        )}

        <div className="flex-1" />

        <Badge className="bg-violet-100 text-violet-700 border-violet-200">
          <Layers className="h-3 w-3 mr-1" />
          {totalCount} наборов
        </Badge>

        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          disabled={deleteAllMutation.isPending}
          onClick={() => {
            if (confirm(`Удалить ВСЕ ${totalCount} наборов атрибутов и их атрибуты?`)) {
              deleteAllMutation.mutate();
            }
          }}
        >
          {deleteAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          Удалить все
        </Button>
      </div>

      {/* Type legend */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground">Типы:</span>
        {Object.entries(attrTypeColors).map(([type, colors]) => (
          <span key={type} className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
            {type}
          </span>
        ))}
      </div>

      {/* Attribute sets list */}
      <div className="space-y-2">
        {attributeSets.map((set) => (
          <AttributeSetCard
            key={set.id}
            set={set}
            isExpanded={expandedSets.has(set.id)}
            onToggle={() => toggleSet(set.id)}
            onDelete={handleDeleteSet}
          />
        ))}
      </div>

      {attributeSets.length === 0 && search && (
        <div className="text-center py-8 text-muted-foreground">
          Наборы не найдены
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function AttributeSetCard({
  set,
  isExpanded,
  onToggle,
  onDelete,
}: {
  set: { id: number; name: string; external_code: string; attributes_count: number };
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
}) {
  const { data: attributes, isLoading } = useQuery({
    queryKey: ['set-attributes', set.id],
    queryFn: () => attributesAPI.getSetAttributes(set.id),
    enabled: isExpanded,
  });

  const requiredCount = attributes?.filter(a => a.is_required).length || 0;

  const typeStats = attributes?.reduce((acc, attr) => {
    acc[attr.attr_type] = (acc[attr.attr_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className={`p-1.5 rounded ${isExpanded ? 'bg-violet-100' : 'bg-gray-100'}`}>
          {isExpanded ? (
            <ChevronDown className={`h-4 w-4 ${isExpanded ? 'text-violet-600' : 'text-gray-500'}`} />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            <span className="font-medium truncate">{set.name}</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {set.external_code}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {requiredCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              {requiredCount} обяз.
            </Badge>
          )}
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {set.attributes_count} атр.
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Удалить набор "${set.name}" и все его атрибуты?`)) onDelete(set.id);
            }}
            className="px-2 py-1 text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded border border-red-200"
          >
            <Trash2 className="h-3 w-3 inline mr-1" />Уд.
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : attributes && attributes.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground">По типам:</span>
                {Object.entries(typeStats).map(([type, count]) => {
                  const style = getAttrTypeStyle(type);
                  return (
                    <span key={type} className={`px-2 py-0.5 rounded ${style.bg} ${style.text} border ${style.border}`}>
                      {type}: {count}
                    </span>
                  );
                })}
              </div>

              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-4">Название</div>
                <div className="col-span-2">Код</div>
                <div className="col-span-2 text-center">Тип</div>
                <div className="col-span-1 text-center">Значений</div>
                <div className="col-span-1 text-center">Статус</div>
                <div className="col-span-2 text-center">Действия</div>
              </div>

              <ScrollArea className="h-[400px]">
                <AttributeRowsList attributes={attributes} setId={set.id} />
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Нет атрибутов
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttributeRowsList({ attributes, setId }: { attributes: Array<{
  id: number;
  name: string;
  external_code: string;
  attr_type: string;
  is_required: boolean;
  options?: Array<{ id: number; name: string; external_code: string }>;
}>; setId: number }) {
  const queryClient = useQueryClient();
  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());
  const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const handleDeleteSelected = async () => {
    if (!confirm(`Удалить ${selectedAttrs.size} атрибутов?`)) return;
    setDeleting(true);
    try {
      for (const attrId of selectedAttrs) {
        try { await fetch(`${API_BASE}/marketplaces/marketplace-attributes/${attrId}/`, { method: 'DELETE' }); } catch {}
      }
      setSelectedAttrs(new Set());
      queryClient.invalidateQueries({ queryKey: ['set-attributes', setId] });
      queryClient.invalidateQueries({ queryKey: ['attribute-sets'] });
    } finally { setDeleting(false); }
  };

  const toggleAttr = (id: number) => {
    setExpandedAttrs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {selectedAttrs.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border-b border-indigo-200">
          <input
            type="checkbox"
            className="w-4 h-4 rounded"
            checked={selectedAttrs.size === attributes.length}
            onChange={e => setSelectedAttrs(e.target.checked ? new Set(attributes.map(a => a.id)) : new Set())}
          />
          <span className="text-sm font-medium text-indigo-700">Выбрано: {selectedAttrs.size}</span>
          <Button size="sm" variant="outline" onClick={() => setSelectedAttrs(new Set())} className="h-6 text-xs">Снять</Button>
          <Button
            size="sm" variant="outline"
            className="h-6 text-xs text-red-600 border-red-200 hover:bg-red-50"
            disabled={deleting}
            onClick={handleDeleteSelected}
          >
            {deleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Удалить выбранные
          </Button>
        </div>
      )}
      {attributes.map((attr, idx) => {
        const typeStyle = getAttrTypeStyle(attr.attr_type);
        const optionsCount = attr.options?.length || 0;
        const isExpanded = expandedAttrs.has(attr.id);
        const hasOptions = optionsCount > 0;

        return (
          <div key={attr.id}>
            <div
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-b transition-colors ${
                hasOptions ? 'cursor-pointer hover:bg-blue-50/50' : ''
              } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                attr.is_required ? 'border-l-2 border-l-red-400' : ''
              } ${isExpanded ? 'bg-blue-50' : ''}`}
              onClick={() => hasOptions && toggleAttr(attr.id)}
            >
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded shrink-0"
                  checked={selectedAttrs.has(attr.id)}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const next = new Set(selectedAttrs);
                    if (e.target.checked) next.add(attr.id); else next.delete(attr.id);
                    setSelectedAttrs(next);
                  }}
                />
                {hasOptions ? (
                  <button className="p-0.5 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${attr.is_required ? 'bg-red-500' : 'bg-gray-300'}`} />
                )}
                <span className="truncate font-medium">{attr.name}</span>
              </div>

              <div className="col-span-2 flex items-center">
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {attr.external_code}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-center">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>
                  {attr.attr_type}
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                {optionsCount > 0 ? (
                  <span className={`text-xs px-2 py-0.5 rounded ${isExpanded ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                    {optionsCount}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <div className="col-span-1 flex items-center justify-center">
                {attr.is_required ? (
                  <span className="text-xs text-red-600 font-medium">Обяз.</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Опц.</span>
                )}
              </div>

              <div className="col-span-2 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Удалить атрибут "${attr.name}"?`)) {
                      fetch(`${API_BASE}/marketplaces/marketplace-attributes/${attr.id}/`, { method: 'DELETE' })
                        .then(() => {
                          queryClient.invalidateQueries({ queryKey: ['set-attributes', setId] });
                          queryClient.invalidateQueries({ queryKey: ['attribute-sets'] });
                        });
                    }
                  }}
                  className="px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200"
                >
                  <Trash2 className="h-3 w-3 inline" />
                </button>
              </div>
            </div>

            {isExpanded && attr.options && attr.options.length > 0 && (
              <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100">
                <div className="ml-6 flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                  {attr.options.slice(0, 100).map((opt) => (
                    <span
                      key={opt.id}
                      className="inline-flex items-center px-2 py-1 bg-white border border-blue-200 rounded text-xs text-gray-700 hover:bg-blue-100 transition-colors"
                      title={`Код: ${opt.external_code}`}
                    >
                      {opt.name}
                    </span>
                  ))}
                  {attr.options.length > 100 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground italic">
                      ...ещё {attr.options.length - 100}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
