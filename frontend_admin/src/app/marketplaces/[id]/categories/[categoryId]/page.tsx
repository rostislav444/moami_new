'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, attributesAPI, aiAPI, type MarketplaceCategory, type AIDiscoveredAttribute } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw, ChevronRight, ChevronLeft, Folder, Loader2, Upload,
  FileSpreadsheet, Save, Trash2, Layers, Search, X, Pencil, Check, Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useRef, useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TYPE_COLORS: Record<string, string> = {
  select: 'bg-blue-100 text-blue-700 border-blue-200',
  multiselect: 'bg-purple-100 text-purple-700 border-purple-200',
  string: 'bg-gray-100 text-gray-700 border-gray-200',
  text: 'bg-slate-100 text-slate-700 border-slate-200',
  int: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  float: 'bg-teal-100 text-teal-700 border-teal-200',
  boolean: 'bg-amber-100 text-amber-700 border-amber-200',
  array: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const marketplaceId = Number(params.id);
  const categoryId = Number(params.categoryId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedAttributes, setParsedAttributes] = useState<AIDiscoveredAttribute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());
  const [attrSearch, setAttrSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRequired, setFilterRequired] = useState<boolean | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingAttr, setEditingAttr] = useState<{ id: number; name: string; external_code: string; attr_type: string; is_required: boolean; suffix: string } | null>(null);
  const [optimizingAttr, setOptimizingAttr] = useState<number | null>(null);

  // Load category + attribute set + attributes in one query
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['marketplace-category', categoryId],
    queryFn: () => categoriesAPI.getCategory(categoryId),
    enabled: !!categoryId,
  });

  // Load attribute sets (cached across category pages)
  const { data: attributeSets, isLoading: setsLoading } = useQuery({
    queryKey: ['attribute-sets', marketplaceId],
    queryFn: () => attributesAPI.listAllSets(marketplaceId),
    enabled: !!marketplaceId,
    staleTime: 5 * 60 * 1000,
  });

  const matchedSet = useMemo(() => {
    if (!attributeSets || !category?.external_code) return null;
    return attributeSets.find((s) => s.external_code === category.external_code) ?? null;
  }, [attributeSets, category?.external_code]);

  // Load attributes for the matched set
  const { data: setAttributesRaw, isLoading: rawAttrsLoading, refetch: refetchAttributes } = useQuery({
    queryKey: ['set-attributes', matchedSet?.id],
    queryFn: () => attributesAPI.getSetAttributes(matchedSet!.id),
    enabled: !!matchedSet?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Combined loading: sets loading OR attributes loading (including waiting for matchedSet)
  const attrsLoading = setsLoading || (!!category?.external_code && !attributeSets) || rawAttrsLoading;

  const attributeSet = matchedSet;
  const setAttributes = setAttributesRaw ?? [];

  // Filter attributes
  const filteredAttributes = useMemo(() => {
    if (!setAttributes) return [];
    return setAttributes.filter((attr) => {
      if (attrSearch) {
        const q = attrSearch.toLowerCase();
        const nameMatch = attr.name.toLowerCase().includes(q);
        const codeMatch = attr.external_code.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }
      if (filterType && attr.attr_type !== filterType) return false;
      if (filterRequired === true && !attr.is_required) return false;
      if (filterRequired === false && attr.is_required) return false;
      return true;
    });
  }, [setAttributes, attrSearch, filterType, filterRequired]);

  // Type stats
  const typeStats = useMemo(() => {
    if (!setAttributes) return {};
    const stats: Record<string, number> = {};
    for (const attr of setAttributes) {
      stats[attr.attr_type] = (stats[attr.attr_type] || 0) + 1;
    }
    return stats;
  }, [setAttributes]);

  const requiredCount = setAttributes?.filter((a) => a.is_required).length ?? 0;

  const toggleAttrExpand = (id: number) => {
    setExpandedAttrs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setParsedAttributes(null);
    try {
      const result = await aiAPI.parseAttributesFile(file, marketplaceId, category?.external_code);
      if (result.success) {
        if (result.saved_count && result.saved_count > 0) {
          // Already saved to DB — just refresh
          queryClient.invalidateQueries({ queryKey: ['attribute-sets', marketplaceId] });
          queryClient.invalidateQueries({ queryKey: ['set-attributes'] });
          setTimeout(() => refetchAttributes(), 500);
          setParsedAttributes(null);
        } else if (result.attributes) {
          setParsedAttributes(result.attributes);
        }
      } else {
        setError(result.error || 'Ошибка парсинга файла');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        queryClient.invalidateQueries({ queryKey: ['attribute-set-by-code', marketplaceId] });
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

  if (categoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Категория не найдена
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/marketplaces/${marketplaceId}`)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <div className="h-5 w-px bg-border" />
        <Folder className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-semibold">{category.name}</h2>
        {category.name_uk && (
          <span className="text-muted-foreground text-sm">/ {category.name_uk}</span>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-md">
          <span className="text-muted-foreground">Код:</span>
          <span className="font-mono font-medium">{category.external_code}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-md">
          <span className="text-muted-foreground">ID:</span>
          <span className="font-mono">{category.external_id}</span>
        </div>
        {setAttributes && (
          <>
            <Badge variant="outline" className="text-sm">
              {setAttributes.length} атрибутов
            </Badge>
            {requiredCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {requiredCount} обязательных
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Parsed attributes preview */}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
            {parsedAttributes.map((attr, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                <span className="truncate">{attr.name}</span>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Badge variant="outline" className="text-xs">{attr.type}</Badge>
                  {attr.is_required && <Badge variant="destructive" className="text-xs">!</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attributes section */}
      <div className="border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Атрибуты</span>
            {/* Type filter chips */}
            {Object.entries(typeStats).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? '' : type)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  filterType === type
                    ? TYPE_COLORS[type] || 'bg-gray-200'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {type} ({count})
              </button>
            ))}
            {/* Required filter */}
            {requiredCount > 0 && (
              <button
                onClick={() => setFilterRequired(filterRequired === true ? null : true)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  filterRequired === true
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Обяз. ({requiredCount})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск атрибутов..."
                value={attrSearch}
                onChange={(e) => setAttrSearch(e.target.value)}
                className="pl-7 w-[200px] h-7 text-sm"
              />
              {attrSearch && (
                <button
                  onClick={() => setAttrSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {(!setAttributes || setAttributes.length === 0) && !attrsLoading && !parsedAttributes && (
              <>
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
                  className="h-7"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1" />
                  )}
                  XLSX
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bulk actions */}
        {selectedAttrs.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border-b border-indigo-200">
            <span className="text-sm font-medium text-indigo-700">Выбрано: {selectedAttrs.size}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedAttrs(new Set())}
              className="h-7 text-xs"
            >
              Снять
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`Удалить ${selectedAttrs.size} атрибутов?`)) return
                setDeleting(true)
                try {
                  for (const attrId of selectedAttrs) {
                    try {
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/marketplaces/marketplace-attributes/${attrId}/`, { method: 'DELETE' })
                    } catch {}
                  }
                  setSelectedAttrs(new Set())
                  refetchAttributes()
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
              Удалить выбранные
            </Button>
          </div>
        )}

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 shrink-0"
            checked={selectedAttrs.size > 0 && selectedAttrs.size === filteredAttributes.length}
            onChange={e => {
              if (e.target.checked) {
                setSelectedAttrs(new Set(filteredAttributes.map(a => a.id)))
              } else {
                setSelectedAttrs(new Set())
              }
            }}
          />
          <span className="flex-1">Название</span>
          <span className="shrink-0 w-32 text-center">Код</span>
          <span className="shrink-0 w-20 text-center">Значений</span>
          <span className="shrink-0 w-24 text-center">Тип</span>
          <span className="shrink-0 w-14 text-center">Обяз.</span>
        </div>

        {/* Attributes list */}
        {attrsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAttributes.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div>
              {filteredAttributes.map((attr) => (
                <div key={attr.id} className="border-b last:border-b-0">
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => attr.options && attr.options.length > 0 && toggleAttrExpand(attr.id)}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 shrink-0"
                      checked={selectedAttrs.has(attr.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const next = new Set(selectedAttrs)
                        if (e.target.checked) next.add(attr.id)
                        else next.delete(attr.id)
                        setSelectedAttrs(next)
                      }}
                    />
                    {attr.options && attr.options.length > 0 ? (
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform text-muted-foreground ${
                          expandedAttrs.has(attr.id) ? 'rotate-90' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}
                    <span className="font-medium flex-1 min-w-0 truncate">{attr.name}</span>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 w-32 text-center truncate">
                      {attr.external_code}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 w-20 text-center">
                      {attr.options && attr.options.length > 0 ? attr.options.length : '—'}
                    </span>
                    <div className="shrink-0 w-24 flex justify-center">
                      <span className={`px-2 py-0.5 rounded text-xs border ${TYPE_COLORS[attr.attr_type] || ''}`}>
                        {attr.attr_type}
                      </span>
                    </div>
                    <span className="shrink-0 w-14 text-center">
                      {attr.is_required && (
                        <Badge variant="destructive" className="text-xs">Да</Badge>
                      )}
                    </span>
                    {(attr.attr_type === 'select' || attr.attr_type === 'multiselect') && attr.options && attr.options.length > 30 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!confirm(`Оптимизировать ${attr.options!.length} значений атрибута "${attr.name}" с помощью ИИ? Лишние будут удалены.`)) return
                          setOptimizingAttr(attr.id)
                          try {
                            const res = await fetch(`${API_BASE}/marketplaces/marketplace-attributes/${attr.id}/optimize-options/`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ category_name: category?.name || '' }),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              alert(`Оптимизировано: было ${data.total_before}, оставлено ${data.kept}, удалено ${data.deleted}`)
                              refetchAttributes()
                            } else {
                              alert(`Ошибка: ${data.error || 'Unknown error'}`)
                            }
                          } catch (err) {
                            alert('Ошибка сети')
                          } finally {
                            setOptimizingAttr(null)
                          }
                        }}
                        disabled={optimizingAttr === attr.id}
                        className="shrink-0 px-2 py-1 text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 disabled:opacity-50"
                        title="Оптимизировать значения с ИИ"
                      >
                        {optimizingAttr === attr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingAttr({
                          id: attr.id,
                          name: attr.name,
                          external_code: attr.external_code,
                          attr_type: attr.attr_type,
                          is_required: attr.is_required,
                          suffix: attr.suffix || '',
                        })
                      }}
                      className="shrink-0 px-2 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Expanded options */}
                  {expandedAttrs.has(attr.id) && attr.options && attr.options.length > 0 && (
                    <div className="px-4 pb-3 pt-1 ml-9 border-t bg-muted/20">
                      <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto py-1">
                        {attr.options.map((opt) => (
                          <span
                            key={opt.id}
                            className="px-2 py-0.5 bg-background border rounded text-xs hover:bg-muted transition-colors"
                            title={`code: ${opt.external_code}`}
                          >
                            {opt.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : setAttributes && setAttributes.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ничего не найдено по фильтру</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => { setAttrSearch(''); setFilterType(''); setFilterRequired(null); }}
            >
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">{attributeSet ? 'Нет атрибутов' : 'Набор атрибутов не найден'}</p>
            <p className="text-sm mt-1">Загрузите XLSX или синхронизируйте атрибуты</p>
          </div>
        )}
      </div>

      {/* Edit attribute modal */}
      {editingAttr && (
        <EditAttributeModal
          attr={editingAttr}
          onClose={() => setEditingAttr(null)}
          onSaved={() => {
            setEditingAttr(null)
            refetchAttributes()
          }}
        />
      )}
    </div>
  );
}

function EditAttributeModal({
  attr,
  onClose,
  onSaved,
}: {
  attr: { id: number; name: string; external_code: string; attr_type: string; is_required: boolean; suffix: string }
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(attr.name)
  const [code, setCode] = useState(attr.external_code)
  const [attrType, setAttrType] = useState(attr.attr_type)
  const [isRequired, setIsRequired] = useState(attr.is_required)
  const [suffix, setSuffix] = useState(attr.suffix)
  const [saving, setSaving] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/marketplaces/marketplace-attributes/${attr.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, external_code: code, attr_type: attrType, is_required: isRequired, suffix }),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const types = ['select', 'multiselect', 'string', 'text', 'int', 'float', 'boolean', 'array']

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать атрибут</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Название</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Код</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <Label className="text-xs">Суффикс (ед. изм.)</Label>
              <Input value={suffix} onChange={e => setSuffix(e.target.value)} className="mt-1" placeholder="мм, г, см" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Тип</Label>
              <select
                value={attrType}
                onChange={e => setAttrType(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Обязательный
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Отмена</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
