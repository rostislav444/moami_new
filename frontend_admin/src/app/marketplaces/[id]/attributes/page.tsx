'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { attributesAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ChevronRight, ChevronDown, Layers, Settings2, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

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

  const { data: attributeSets, isLoading } = useQuery({
    queryKey: ['attribute-sets', id],
    queryFn: () => attributesAPI.listSets(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AttributesTab attributeSets={attributeSets || []} />;
}

function AttributesTab({ attributeSets }: { attributeSets: Array<{ id: number; external_code: string; name: string; attributes_count: number }> }) {
  const [search, setSearch] = useState('');
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set());

  const toggleSet = (id: number) => {
    setExpandedSets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calculate stats
  const totalAttributes = attributeSets.reduce((sum, s) => sum + s.attributes_count, 0);

  // Filter sets by search
  const filteredSets = search
    ? attributeSets.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.external_code.toLowerCase().includes(search.toLowerCase())
      )
    : attributeSets;

  if (!attributeSets.length) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
        <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Атрибуты не загружены</p>
        <p className="text-sm mt-1">Загрузите XLSX файл с атрибутами для категории</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with stats and search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по наборам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1" />

        <Badge className="bg-violet-100 text-violet-700 border-violet-200">
          <Layers className="h-3 w-3 mr-1" />
          {attributeSets.length} наборов
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Settings2 className="h-3 w-3 mr-1" />
          {totalAttributes} атрибутов
        </Badge>
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
        {filteredSets.map((set) => (
          <AttributeSetCard
            key={set.id}
            set={set}
            isExpanded={expandedSets.has(set.id)}
            onToggle={() => toggleSet(set.id)}
          />
        ))}
      </div>

      {filteredSets.length === 0 && search && (
        <div className="text-center py-8 text-muted-foreground">
          Наборы не найдены
        </div>
      )}
    </div>
  );
}

function AttributeSetCard({
  set,
  isExpanded,
  onToggle,
}: {
  set: { id: number; name: string; external_code: string; attributes_count: number };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: attributes, isLoading } = useQuery({
    queryKey: ['set-attributes', set.id],
    queryFn: () => attributesAPI.getSetAttributes(set.id),
    enabled: isExpanded,
  });

  // Count required attributes
  const requiredCount = attributes?.filter(a => a.is_required).length || 0;

  // Group by type for stats
  const typeStats = attributes?.reduce((acc, attr) => {
    acc[attr.attr_type] = (acc[attr.attr_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
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
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : attributes && attributes.length > 0 ? (
            <>
              {/* Type stats bar */}
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

              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-4">Название</div>
                <div className="col-span-2">Код</div>
                <div className="col-span-2 text-center">Тип</div>
                <div className="col-span-2 text-center">Значений</div>
                <div className="col-span-2 text-center">Статус</div>
              </div>

              {/* Attributes */}
              <ScrollArea className="h-[400px]">
                <AttributeRowsList attributes={attributes} />
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

// Attribute rows with expandable options
function AttributeRowsList({ attributes }: { attributes: Array<{
  id: number;
  name: string;
  external_code: string;
  attr_type: string;
  is_required: boolean;
  options?: Array<{ id: number; name: string; external_code: string }>;
}> }) {
  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());

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
      {attributes.map((attr, idx) => {
        const typeStyle = getAttrTypeStyle(attr.attr_type);
        const optionsCount = attr.options?.length || 0;
        const isExpanded = expandedAttrs.has(attr.id);
        const hasOptions = optionsCount > 0;

        return (
          <div key={attr.id}>
            {/* Attribute row */}
            <div
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-b transition-colors ${
                hasOptions ? 'cursor-pointer hover:bg-blue-50/50' : ''
              } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                attr.is_required ? 'border-l-2 border-l-red-400' : ''
              } ${isExpanded ? 'bg-blue-50' : ''}`}
              onClick={() => hasOptions && toggleAttr(attr.id)}
            >
              {/* Name */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
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

              {/* Code */}
              <div className="col-span-2 flex items-center">
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {attr.external_code}
                </span>
              </div>

              {/* Type */}
              <div className="col-span-2 flex items-center justify-center">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>
                  {attr.attr_type}
                </span>
              </div>

              {/* Options count */}
              <div className="col-span-2 flex items-center justify-center">
                {optionsCount > 0 ? (
                  <span className={`text-xs px-2 py-0.5 rounded ${isExpanded ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                    {optionsCount} знач.
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Required status */}
              <div className="col-span-2 flex items-center justify-center">
                {attr.is_required ? (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Обяз.
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Опц.</span>
                )}
              </div>
            </div>

            {/* Expanded options */}
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
