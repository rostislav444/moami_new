'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  attributeLevelsAPI,
  type CategoryMappingSummary,
  type CategoryAttributeConfig,
  type AttributeConfigItem,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  RefreshCw,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const LEVEL_OPTIONS = [
  { value: 'product', label: 'Товар', color: 'bg-blue-100 text-blue-800' },
  { value: 'variant', label: 'Вариант', color: 'bg-purple-100 text-purple-800' },
  { value: 'size', label: 'Размер', color: 'bg-teal-100 text-teal-800' },
  { value: 'brand', label: 'Бренд (авто)', color: 'bg-amber-100 text-amber-800' },
  { value: 'color', label: 'Цвет (авто)', color: 'bg-pink-100 text-pink-800' },
  { value: 'country', label: 'Страна (авто)', color: 'bg-orange-100 text-orange-800' },
  { value: 'composition', label: 'Состав ткани (авто)', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'skip', label: 'Пропустить', color: 'bg-gray-100 text-gray-500' },
]

const ATTR_TYPE_COLORS: Record<string, string> = {
  select: 'bg-blue-100 text-blue-800',
  multiselect: 'bg-purple-100 text-purple-800',
  string: 'bg-gray-100 text-gray-800',
  text: 'bg-slate-100 text-slate-800',
  int: 'bg-emerald-100 text-emerald-800',
  float: 'bg-teal-100 text-teal-800',
  boolean: 'bg-amber-100 text-amber-800',
  array: 'bg-indigo-100 text-indigo-800',
}

export default function CategoriesConfigPage() {
  const { id } = useParams<{ id: string }>()
  const marketplaceId = Number(id)
  const queryClient = useQueryClient()

  const [expandedMapping, setExpandedMapping] = useState<number | null>(null)

  // Список маппингов категорий
  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['attribute-levels-mappings', marketplaceId],
    queryFn: () => attributeLevelsAPI.mappingsList(marketplaceId),
    staleTime: 60_000,
  })

  const aiAssign = useMutation({
    mutationFn: () => attributeLevelsAPI.aiAssign(marketplaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute-levels-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['attribute-level-config'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Конфигурация атрибутов по категориям</h2>
          <p className="text-muted-foreground">
            Для каждой замапленной категории — настроить уровень заполнения атрибутов маркетплейса
          </p>
        </div>
        <Button
          onClick={() => aiAssign.mutate()}
          disabled={aiAssign.isPending || mappings.length === 0}
          variant="outline"
        >
          {aiAssign.isPending
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <span className="mr-2">🤖</span>
          }
          AI назначить все
        </Button>
      </div>

      {aiAssign.data && (
        <Card className={aiAssign.data.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="py-3 text-sm">
            {aiAssign.data.success
              ? `Готово: ${aiAssign.data.saved} уровней для ${aiAssign.data.categories_processed} категорий`
              : `Ошибки: ${aiAssign.data.errors?.join(', ')}`
            }
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : mappings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет замапленных категорий. Сначала создайте маппинг категорий.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mappings.map(mapping => (
            <CategoryMappingCard
              key={mapping.category_mapping_id}
              mapping={mapping}
              isExpanded={expandedMapping === mapping.category_mapping_id}
              onToggle={() => setExpandedMapping(
                expandedMapping === mapping.category_mapping_id ? null : mapping.category_mapping_id
              )}
              marketplaceId={marketplaceId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryMappingCard({
  mapping,
  isExpanded,
  onToggle,
  marketplaceId,
}: {
  mapping: CategoryMappingSummary
  isExpanded: boolean
  onToggle: () => void
  marketplaceId: number
}) {
  const queryClient = useQueryClient()
  const isConfigured = mapping.configured_attributes > 0
  const isFullyConfigured = mapping.configured_attributes >= mapping.total_attributes
  const [aiLoading, setAiLoading] = useState(false)
  const [loadingAttrs, setLoadingAttrs] = useState(false)
  const [loadResult, setLoadResult] = useState<string | null>(null)

  const handleAiAssign = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setAiLoading(true)
    try {
      await attributeLevelsAPI.aiAssignCategory(mapping.category_mapping_id)
      queryClient.invalidateQueries({ queryKey: ['attribute-levels-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['attribute-level-config', mapping.category_mapping_id] })
    } finally {
      setAiLoading(false)
    }
  }

  const handleLoadAttributes = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingAttrs(true)
    setLoadResult(null)
    try {
      const res = await attributeLevelsAPI.aiLoadAttributes(mapping.category_mapping_id)
      if (res.success) {
        setLoadResult(`+${res.created_attributes} атр., +${res.created_options} опций (всего: ${res.total_in_set})`)
        queryClient.invalidateQueries({ queryKey: ['attribute-levels-mappings'] })
        queryClient.invalidateQueries({ queryKey: ['attribute-level-config', mapping.category_mapping_id] })
      }
    } catch (err) {
      setLoadResult('Ошибка')
    } finally {
      setLoadingAttrs(false)
    }
  }

  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{mapping.our_category_name}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-sm text-muted-foreground truncate">{mapping.mp_category_name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Код: {mapping.mp_category_code}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isFullyConfigured ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {mapping.configured_attributes}/{mapping.total_attributes}
            </Badge>
          ) : isConfigured ? (
            <Badge className="bg-amber-100 text-amber-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              {mapping.configured_attributes}/{mapping.total_attributes}
            </Badge>
          ) : (
            <Badge variant="secondary">
              0/{mapping.total_attributes} атрибутов
            </Badge>
          )}
        </div>
      </button>
      <div className="px-6 pb-2 flex justify-end -mt-2">
        <button
          onClick={handleAiAssign}
          disabled={aiLoading || mapping.total_attributes === 0}
          className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
          AI назначить
        </button>
        <button
          onClick={handleLoadAttributes}
          disabled={loadingAttrs}
          className="px-2.5 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 disabled:opacity-50"
        >
          {loadingAttrs ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
          AI атрибуты
        </button>
        {loadResult && <span className="text-xs text-emerald-600">{loadResult}</span>}
      </div>

      {isExpanded && (
        <CardContent className="border-t pt-4">
          <AttributeLevelEditor
            categoryMappingId={mapping.category_mapping_id}
            marketplaceId={marketplaceId}
          />
        </CardContent>
      )}
    </Card>
  )
}

function AttributeLevelEditor({
  categoryMappingId,
  marketplaceId,
}: {
  categoryMappingId: number
  marketplaceId: number
}) {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['attribute-level-config', categoryMappingId],
    queryFn: () => attributeLevelsAPI.config(categoryMappingId),
    staleTime: 30_000,
  })

  const [localLevels, setLocalLevels] = useState<Record<number, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const setLevel = (attrId: number, level: string) => {
    setLocalLevels(prev => ({ ...prev, [attrId]: level }))
    setHasChanges(true)
  }

  const setAllTo = (level: string) => {
    if (!config) return
    const newLevels: Record<number, string> = {}
    for (const attr of config.attributes) {
      newLevels[attr.mp_attribute_id] = level
    }
    setLocalLevels(newLevels)
    setHasChanges(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config) return
      // Build levels from current state: localLevels override config.level
      const levels: { marketplace_attribute_id: number; level: string }[] = []
      for (const attr of config.attributes) {
        const level = localLevels[attr.mp_attribute_id] ?? attr.level
        if (level) {
          levels.push({ marketplace_attribute_id: attr.mp_attribute_id, level })
        }
      }
      return attributeLevelsAPI.bulkUpdate(categoryMappingId, levels)
    },
    onSuccess: () => {
      setHasChanges(false)
      setLocalLevels({})  // Reset local overrides
      queryClient.invalidateQueries({ queryKey: ['attribute-level-config', categoryMappingId] })
      queryClient.invalidateQueries({ queryKey: ['attribute-levels-mappings'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!config || config.attributes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Нет атрибутов. Синхронизируйте атрибуты для этой категории.
      </p>
    )
  }

  // Merge: local overrides > saved from backend
  const currentLevels: Record<number, string> = {}
  if (config) {
    for (const attr of config.attributes) {
      currentLevels[attr.mp_attribute_id] = localLevels[attr.mp_attribute_id] ?? attr.level ?? ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Быстро:</span>
        {LEVEL_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setAllTo(opt.value)}
          >
            Все → {opt.label}
          </Button>
        ))}
      </div>

      {/* Attributes table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Атрибут</th>
              <th className="text-left px-4 py-2 font-medium w-24">Тип</th>
              <th className="text-center px-4 py-2 font-medium w-16">Обяз.</th>
              <th className="text-center px-4 py-2 font-medium w-16">Опции</th>
              <th className="text-left px-4 py-2 font-medium w-48">Уровень</th>
            </tr>
          </thead>
          <tbody>
            {config.attributes.map(attr => {
              const currentLevel = currentLevels[attr.mp_attribute_id] || ''
              return (
                <tr key={attr.mp_attribute_id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2">
                    <div>
                      <span className="font-medium">{attr.name}</span>
                      {attr.group_name && (
                        <span className="text-xs text-muted-foreground ml-2">{attr.group_name}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{attr.external_code}</div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={ATTR_TYPE_COLORS[attr.attr_type] || 'bg-gray-100'}>
                      {attr.attr_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {attr.is_required && <span className="text-red-500 font-bold">*</span>}
                  </td>
                  <td className="px-4 py-2 text-center text-muted-foreground">
                    {attr.options_count > 0 ? attr.options_count : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={currentLevel}
                      onChange={e => setLevel(attr.mp_attribute_id, e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value="">— не задано —</option>
                      {LEVEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {config.attributes.length} атрибутов,{' '}
          {config.attributes.filter(a => a.is_required).length} обязательных
        </span>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Save className="mr-2 h-4 w-4" />
          }
          Сохранить
        </Button>
      </div>
    </div>
  )
}
