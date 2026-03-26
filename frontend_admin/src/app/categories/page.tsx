'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  categoriesAPI,
  marketplacesAPI,
  attributeLevelsAPI,
  type Category,
  type CategoryMapping,
  type Marketplace,
  type CategoryMappingSummary,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Circle,
  ExternalLink,
} from 'lucide-react'

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // Our categories
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['our-categories'],
    queryFn: categoriesAPI.listOur,
    staleTime: 120_000,
  })

  // All marketplaces
  const { data: marketplaces = [] } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
    staleTime: 120_000,
  })

  const activeMarketplaces = marketplaces.filter(m => m.is_active)

  // Load all mappings and levels in single queries using Promise.all
  const { data: allData } = useQuery({
    queryKey: ['categories-page-data', activeMarketplaces.map(m => m.id).join(',')],
    queryFn: async () => {
      if (activeMarketplaces.length === 0) return { mappings: {}, levels: {} }

      const [mappingsResults, levelsResults] = await Promise.all([
        Promise.all(activeMarketplaces.map(mp =>
          categoriesAPI.listMappings({ marketplace: mp.id }).then(data => ({ mp, data }))
        )),
        Promise.all(activeMarketplaces.map(mp =>
          attributeLevelsAPI.mappingsList(mp.id).then(data => ({ mp, data }))
        )),
      ])

      return {
        mappings: Object.fromEntries(mappingsResults.map(r => [r.mp.id, r.data])),
        levels: Object.fromEntries(levelsResults.map(r => [r.mp.id, r.data])),
      }
    },
    staleTime: 60_000,
    enabled: activeMarketplaces.length > 0,
  })

  // Build lookup: our_category_id -> { mp_slug: { mappings, levels } }
  const categoryInfo = new Map<number, Map<string, {
    marketplace: Marketplace
    mappings: CategoryMapping[]
    levelSummary: CategoryMappingSummary | null
  }>>()

  for (const mp of activeMarketplaces) {
    const mpMappings = allData?.mappings[mp.id] || []
    const levelData = allData?.levels[mp.id] || []

    for (const mapping of mpMappings) {
      if (!categoryInfo.has(mapping.category)) {
        categoryInfo.set(mapping.category, new Map())
      }
      const catMap = categoryInfo.get(mapping.category)!

      if (!catMap.has(mp.slug)) {
        catMap.set(mp.slug, {
          marketplace: mp,
          mappings: [],
          levelSummary: null,
        })
      }

      const info = catMap.get(mp.slug)!
      info.mappings.push(mapping)

      const lvl = levelData.find((l: CategoryMappingSummary) => l.category_mapping_id === mapping.id)
      if (lvl) info.levelSummary = lvl
    }
  }

  const toggleCategory = (catId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // Filter categories
  const filteredCategories = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Категории</h1>
        <p className="text-muted-foreground">
          Наши категории с маппингами маркетплейсов и статусом конфигурации атрибутов
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск категории..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Атрибуты настроены
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          Частично настроены
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-3 w-3 text-gray-300" />
          Не настроены
        </div>
      </div>

      {/* Categories list */}
      <Card>
        <CardContent className="p-0">
          {loadingCats ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Категории не найдены
            </div>
          ) : (
            <div className="divide-y">
              {filteredCategories.map(cat => {
                const catMappings = categoryInfo.get(cat.id)
                const hasMappings = catMappings && catMappings.size > 0
                const isExpanded = expandedCategories.has(cat.id)

                return (
                  <div key={cat.id}>
                    {/* Category row */}
                    <button
                      onClick={() => hasMappings && toggleCategory(cat.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-muted/30 transition-colors ${
                        !hasMappings ? 'opacity-60' : ''
                      }`}
                      disabled={!hasMappings}
                    >
                      {/* Indentation */}
                      <div style={{ width: `${cat.level * 20}px` }} className="shrink-0" />

                      {/* Expand arrow */}
                      {hasMappings ? (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 shrink-0" />
                          : <ChevronRight className="h-4 w-4 shrink-0" />
                      ) : (
                        <div className="w-4 shrink-0" />
                      )}

                      {/* Icon */}
                      <FolderTree className="h-4 w-4 text-muted-foreground shrink-0" />

                      {/* Name */}
                      <span className="font-medium text-sm">{cat.name}</span>

                      {/* Marketplace badges */}
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        {hasMappings && Array.from(catMappings!.entries()).map(([slug, info]) => {
                          const totalAttrs = info.levelSummary?.total_attributes || 0
                          const configuredAttrs = info.levelSummary?.configured_attributes || 0

                          let StatusIcon = Circle
                          let statusColor = 'text-gray-300'
                          if (totalAttrs > 0 && configuredAttrs >= totalAttrs) {
                            StatusIcon = CheckCircle2
                            statusColor = 'text-green-500'
                          } else if (configuredAttrs > 0) {
                            StatusIcon = AlertCircle
                            statusColor = 'text-amber-500'
                          }

                          return (
                            <Badge
                              key={slug}
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                            >
                              <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                              {info.marketplace.name}
                              <span className="text-muted-foreground">
                                ({info.mappings.length})
                              </span>
                            </Badge>
                          )
                        })}
                      </div>
                    </button>

                    {/* Expanded: marketplace details */}
                    {isExpanded && catMappings && (
                      <div className="bg-muted/20 border-t px-4 py-3 space-y-3">
                        {Array.from(catMappings.entries()).map(([slug, info]) => (
                          <div key={slug} className="bg-background rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{info.marketplace.name}</span>
                              <Link
                                href={`/marketplaces/${info.marketplace.id}/attr-mapping`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Настроить атрибуты
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>

                            {/* Mapped mp categories */}
                            <div className="space-y-1">
                              {info.mappings.map(mapping => (
                                <div
                                  key={mapping.id}
                                  className="flex items-center gap-2 text-sm py-1"
                                >
                                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-muted-foreground">{mapping.marketplace_category_name}</span>

                                  {info.levelSummary && (
                                    <span className="ml-auto text-xs text-muted-foreground">
                                      {info.levelSummary.configured_attributes}/{info.levelSummary.total_attributes} атрибутов настроено
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
