'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  entityMappingsAPI,
  type EntityMappingItem,
  type MarketplaceEntity,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeftRight,
  Search,
  Link2,
  Unlink,
  Wand2,
  Loader2,
  RefreshCw,
  Tag,
  Palette,
  Globe,
  Ruler,
} from 'lucide-react'

type EntityTab = 'brands' | 'colors' | 'countries' | 'sizes'

const TABS: { key: EntityTab; label: string; icon: React.ElementType; entityType: string }[] = [
  { key: 'brands', label: 'Бренды', icon: Tag, entityType: 'brand' },
  { key: 'colors', label: 'Цвета', icon: Palette, entityType: 'color' },
  { key: 'countries', label: 'Страны', icon: Globe, entityType: 'country' },
  { key: 'sizes', label: 'Размеры', icon: Ruler, entityType: 'size' },
]

export default function EntityMappingPage() {
  const { id } = useParams<{ id: string }>()
  const marketplaceId = Number(id)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<EntityTab>('brands')
  const [ourSearch, setOurSearch] = useState('')
  const [mpSearch, setMpSearch] = useState('')
  const [selectedOur, setSelectedOur] = useState<{ id: number; name: string } | null>(null)
  const [selectedMp, setSelectedMp] = useState<MarketplaceEntity | null>(null)

  const tabInfo = TABS.find(t => t.key === activeTab)!

  // API mapping for each tab
  const apiMap = {
    brands: entityMappingsAPI.brands,
    colors: entityMappingsAPI.colors,
    countries: entityMappingsAPI.countries,
    sizes: entityMappingsAPI.sizes,
  }

  const api = apiMap[activeTab]

  // Our entities
  const ourEntitiesQuery = useQuery({
    queryKey: ['our-entities', activeTab],
    queryFn: () => {
      if (activeTab === 'brands') return entityMappingsAPI.brands.ourBrands()
      if (activeTab === 'colors') return entityMappingsAPI.colors.ourColors()
      if (activeTab === 'countries') return entityMappingsAPI.countries.ourCountries()
      return entityMappingsAPI.sizes.ourSizes()
    },
    staleTime: 60_000,
  })

  // Marketplace entities
  const mpEntitiesQuery = useQuery({
    queryKey: ['mp-entities', marketplaceId, tabInfo.entityType, mpSearch],
    queryFn: () => entityMappingsAPI.listEntities(marketplaceId, tabInfo.entityType, mpSearch || undefined),
    staleTime: 60_000,
  })

  // Existing mappings
  const mappingsQuery = useQuery({
    queryKey: ['entity-mappings', activeTab, marketplaceId],
    queryFn: () => api.list(marketplaceId),
    staleTime: 30_000,
  })

  // Create mapping
  const createMapping = useMutation({
    mutationFn: (data: Record<string, number>) => {
      return api.create(data as never)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-mappings', activeTab] })
      setSelectedOur(null)
      setSelectedMp(null)
    },
  })

  // Delete mapping
  const deleteMapping = useMutation({
    mutationFn: api.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entity-mappings', activeTab] }),
  })

  // Auto map
  const autoMap = useMutation({
    mutationFn: () => api.autoMap(marketplaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entity-mappings', activeTab] }),
  })

  const handleLink = () => {
    if (!selectedOur || !selectedMp) return

    const fieldMap: Record<EntityTab, string> = {
      brands: 'brand',
      colors: 'color',
      countries: 'country',
      sizes: 'size',
    }

    createMapping.mutate({
      [fieldMap[activeTab]]: selectedOur.id,
      marketplace_entity: selectedMp.id,
    })
  }

  const handleTabChange = (tab: EntityTab) => {
    setActiveTab(tab)
    setSelectedOur(null)
    setSelectedMp(null)
    setOurSearch('')
    setMpSearch('')
  }

  // Mapped our entity IDs
  const mappedOurIds = new Set(
    (mappingsQuery.data || []).map(m => {
      const fieldMap: Record<EntityTab, string> = {
        brands: 'brand',
        colors: 'color',
        countries: 'country',
        sizes: 'size',
      }
      return (m as Record<string, unknown>)[fieldMap[activeTab]] as number
    })
  )

  // Filter our entities
  const ourEntities = (ourEntitiesQuery.data || []).filter(e =>
    !ourSearch || e.name.toLowerCase().includes(ourSearch.toLowerCase())
  )

  // Get display name fields from mapping
  const getMappingDisplay = (mapping: EntityMappingItem) => {
    const nameField = `${activeTab === 'brands' ? 'brand' : activeTab === 'colors' ? 'color' : activeTab === 'countries' ? 'country' : 'size'}_name`
    const entityField = 'entity_name'
    return {
      ourName: (mapping as Record<string, unknown>)[nameField] as string || '—',
      mpName: (mapping as Record<string, unknown>)[entityField] as string || '—',
      mpExternalId: (mapping as Record<string, unknown>)['entity_external_id'] as string || '',
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Маппинг сущностей</h2>
          <p className="text-muted-foreground">
            Бренды, цвета, страны, размеры
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Auto-map button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => autoMap.mutate()}
          disabled={autoMap.isPending}
        >
          {autoMap.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Авто-маппинг по имени
        </Button>
        {autoMap.data && (
          <Badge variant="secondary">{autoMap.data.matched} совпадений</Badge>
        )}
      </div>

      {/* Two-column mapping */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Our entities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Наши {tabInfo.label.toLowerCase()}</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={ourSearch}
                onChange={e => setOurSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {ourEntitiesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="px-3 pb-3 space-y-1">
                  {ourEntities.map(entity => {
                    const mapped = mappedOurIds.has(entity.id)
                    const isSelected = selectedOur?.id === entity.id

                    return (
                      <button
                        key={entity.id}
                        onClick={() => setSelectedOur(isSelected ? null : entity)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border border-blue-300'
                            : mapped
                            ? 'bg-green-50 text-green-700'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {mapped && <Badge variant="outline" className="text-green-600 border-green-300 text-xs">mapped</Badge>}
                        <span>{entity.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Marketplace entities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{tabInfo.label} маркетплейса</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={mpSearch}
                onChange={e => setMpSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {mpEntitiesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (mpEntitiesQuery.data || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Сущности не загружены. Синхронизируйте через pipeline.
                </p>
              ) : (
                <div className="px-3 pb-3 space-y-1">
                  {(mpEntitiesQuery.data || []).map(entity => {
                    const isSelected = selectedMp?.id === entity.id

                    return (
                      <button
                        key={entity.id}
                        onClick={() => setSelectedMp(isSelected ? null : entity)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border border-blue-300'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <span className="flex-1">{entity.name}</span>
                        <span className="text-xs text-muted-foreground">{entity.external_id}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Link button */}
      {selectedOur && selectedMp && (
        <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="font-medium text-sm">{selectedOur.name}</span>
          <ArrowLeftRight className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-sm">{selectedMp.name}</span>
          <Button
            onClick={handleLink}
            disabled={createMapping.isPending}
            size="sm"
          >
            {createMapping.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Link2 className="mr-2 h-4 w-4" />
            }
            Связать
          </Button>
        </div>
      )}

      {/* Existing mappings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Существующие маппинги — {tabInfo.label}</CardTitle>
              <CardDescription>{(mappingsQuery.data || []).length} связей</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['entity-mappings', activeTab] })}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappingsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (mappingsQuery.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет маппингов. Используйте авто-маппинг или создайте вручную.
            </p>
          ) : (
            <div className="space-y-2">
              {(mappingsQuery.data || []).map(mapping => {
                const display = getMappingDisplay(mapping)
                return (
                  <div
                    key={mapping.id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <span className="flex-1 text-sm font-medium">{display.ourName}</span>
                    <ArrowLeftRight className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{display.mpName}</span>
                      {display.mpExternalId && (
                        <span className="text-muted-foreground ml-2 text-xs">({display.mpExternalId})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteMapping.mutate(mapping.id)}
                      disabled={deleteMapping.isPending}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
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
