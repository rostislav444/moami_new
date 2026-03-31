'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  productAdminAPI,
  categoriesAPI,
  lookupsAPI,
  marketplacesAPI,
  type ProductListItem,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  ready: { label: 'Готов', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
  partial: { label: 'Частично', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700' },
  empty: { label: 'Пусто', dot: 'bg-red-400', bg: 'bg-red-50 text-red-600' },
  not_configured: { label: 'Не настроен', dot: 'bg-slate-300', bg: 'bg-slate-50 text-slate-500' },
  no_mapping: { label: 'Нет маппинга', dot: 'bg-slate-200', bg: 'bg-slate-50 text-slate-400' },
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>()

  const { data: aiUsage } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: lookupsAPI.aiUsage,
    staleTime: 30_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page, categoryFilter],
    queryFn: () => productAdminAPI.list({
      search: search || undefined,
      page,
      category: categoryFilter,
      page_size: 50,
    }),
    staleTime: 30_000,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['our-categories'],
    queryFn: categoriesAPI.listOur,
    staleTime: 120_000,
  })

  const { data: marketplaces = [] } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
    staleTime: 120_000,
  })

  const activeMarketplaces = marketplaces.filter(m => m.is_active)
  const [withImages, setWithImages] = useState(true)

  // Bulk AI fill — client-driven, one product at a time
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkMpId, setBulkMpId] = useState<number | null>(null)
  const bulkAbortRef = useRef(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, filled: 0, skipped: 0, errors: 0, currentName: '' })
  const [bulkDone, setBulkDone] = useState(false)
  const [bulkLog, setBulkLog] = useState<{ id: number; name: string; mpResults: { mp: string; status: 'filled' | 'skipped' | 'error' }[]; done: boolean }[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [bulkLog])

  const startBulkFill = async (mpIds: number[]) => {
    setBulkRunning(true)
    setBulkMpId(mpIds[0])
    setBulkDone(false)
    bulkAbortRef.current = false
    setBulkProgress({ current: 0, total: 0, filled: 0, skipped: 0, errors: 0, currentName: '' })
    setBulkLog([])

    try {
      // Fetch all product IDs
      let allProducts: { id: number; name: string }[] = []
      let pg = 1
      while (true) {
        const res = await productAdminAPI.list({ page: pg, page_size: 50 })
        allProducts = allProducts.concat(res.results.map(p => ({ id: p.id, name: p.name })))
        if (!res.next) break
        pg++
      }

      const totalOps = allProducts.length * mpIds.length
      setBulkProgress(prev => ({ ...prev, total: totalOps }))

      let opIdx = 0
      // Product-by-product, all marketplaces inside each product
      for (let i = 0; i < allProducts.length; i++) {
        if (bulkAbortRef.current) break
        const p = allProducts[i]

        // Add product entry to log (not done yet)
        setBulkLog(prev => [...prev, { id: p.id, name: p.name, mpResults: [], done: false }])

        for (const mpId of mpIds) {
          if (bulkAbortRef.current) break
          opIdx++

          const mpName = activeMarketplaces.find(m => m.id === mpId)?.name || ''
          setBulkProgress(prev => ({ ...prev, current: opIdx, currentName: `${p.name} → ${mpName}` }))

          let mpStatus: 'filled' | 'skipped' | 'error' = 'skipped'
          try {
            const result = await productAdminAPI.aiFill(p.id, mpId, withImages)
            if (result.success) {
              const d = result as Record<string, unknown>
              if (d.filled_product || d.filled_variants || d.filled_sizes) {
                await productAdminAPI.saveAttributes(p.id, {
                  marketplace_id: mpId,
                  product_attributes: _buildPayloadFromFilled(d.filled_product as Record<string, unknown>),
                  variant_attributes: _buildVariantPayload(d.filled_variants as Record<string, Record<string, unknown>>),
                  size_attributes: _buildSizePayload(d.filled_sizes as Record<string, Record<string, unknown>>),
                })
                setBulkProgress(prev => ({ ...prev, filled: prev.filled + 1 }))
                mpStatus = 'filled'
              } else {
                setBulkProgress(prev => ({ ...prev, skipped: prev.skipped + 1 }))
              }
            } else {
              setBulkProgress(prev => ({ ...prev, errors: prev.errors + 1 }))
              mpStatus = 'error'
            }
          } catch {
            setBulkProgress(prev => ({ ...prev, errors: prev.errors + 1 }))
            mpStatus = 'error'
          }

          // Update product log entry with this MP result
          setBulkLog(prev => {
            const next = [...prev]
            const idx = next.findIndex(e => e.id === p.id)
            if (idx !== -1) {
              next[idx] = { ...next[idx], mpResults: [...next[idx].mpResults, { mp: mpName, status: mpStatus }] }
            }
            return next
          })

          if (opIdx % 5 === 0) {
            queryClient.invalidateQueries({ queryKey: ['ai-usage'] })
          }
        }

        // Mark product as done (all marketplaces processed)
        setBulkLog(prev => {
          const next = [...prev]
          const idx = next.findIndex(e => e.id === p.id)
          if (idx !== -1) next[idx] = { ...next[idx], done: true }
          return next
        })
      }
    } finally {
      setBulkRunning(false)
      setBulkDone(true)
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    }
  }

  const stopBulkFill = () => {
    bulkAbortRef.current = true
  }

  const products = data?.results || []
  const totalPages = data ? Math.ceil(data.count / 50) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Товары</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.count ?? '...'} товаров
          </p>
        </div>
        <div className="flex items-center gap-4">
          {aiUsage && (
            <div className="text-right text-xs text-slate-400">
              <span className="text-slate-600 font-medium">${aiUsage.total_cost_usd.toFixed(4)}</span>
              <span className="ml-1.5">AI</span>
              <span className="ml-2">{aiUsage.total_calls} вызовов</span>
            </div>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withImages}
              onChange={e => setWithImages(e.target.checked)}
              className="w-3.5 h-3.5 rounded"
              disabled={bulkRunning}
            />
            <ImageIcon className="h-3.5 w-3.5" />
            С фото
          </label>
          {bulkRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={stopBulkFill}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Остановить
            </Button>
          ) : (
            <>
              {activeMarketplaces.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startBulkFill(activeMarketplaces.map(m => m.id))}
                  disabled={bulkRunning}
                  className="border-violet-200 text-violet-600 hover:bg-violet-50"
                >
                  AI все МП ({activeMarketplaces.length})
                </Button>
              )}
              {activeMarketplaces.map(mp => (
                <Button
                  key={mp.id}
                  variant="outline"
                  size="sm"
                  onClick={() => startBulkFill([mp.id])}
                  disabled={bulkRunning}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  AI ({mp.name})
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bulk progress */}
      {(bulkRunning || bulkDone) && (
        <div className={`rounded-xl border px-5 py-3 ${
          bulkDone && !bulkRunning ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {bulkRunning
                ? `${bulkProgress.current}/${bulkProgress.total}: ${bulkProgress.currentName}`
                : `Готово`
              }
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="text-indigo-600 font-medium">{bulkLog.filter(e => e.done).length} товаров</span>
              <span className="text-emerald-600">{bulkProgress.filled} заполнено</span>
              <span>{bulkProgress.skipped} пропущено</span>
              {bulkProgress.errors > 0 && <span className="text-red-500">{bulkProgress.errors} ошибок</span>}
              {!bulkRunning && (
                <button onClick={() => setBulkDone(false)} className="text-slate-400 hover:text-slate-700">Закрыть</button>
              )}
            </div>
          </div>
          {bulkProgress.total > 0 && (
            <div className="w-full bg-white/50 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%` }}
              />
            </div>
          )}
          {bulkLog.length > 0 && (
            <div ref={logRef} className="mt-3 max-h-[250px] overflow-auto text-xs space-y-1 bg-white/60 rounded-lg p-2">
              {bulkLog.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  {entry.done ? (
                    <span className={
                      entry.mpResults.every(r => r.status === 'filled') ? 'text-emerald-600 font-medium' :
                      entry.mpResults.some(r => r.status === 'error') ? 'text-red-500' : 'text-slate-400'
                    }>
                      {entry.mpResults.every(r => r.status === 'filled') ? '✓ Обработан' :
                       entry.mpResults.some(r => r.status === 'error') ? '✗ Ошибка' : '— Пропущен'}
                    </span>
                  ) : (
                    <span className="text-indigo-500 animate-pulse">⟳</span>
                  )}
                  <a
                    href={`/products/${entry.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate max-w-[300px]"
                  >
                    {entry.name}
                  </a>
                  {entry.mpResults.map((r, j) => (
                    <span key={j} className={
                      r.status === 'filled' ? 'text-emerald-600' :
                      r.status === 'error' ? 'text-red-500' : 'text-slate-400'
                    }>
                      {r.status === 'filled' ? '✓' : r.status === 'error' ? '✗' : '—'} {r.mp}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Поиск по названию или коду..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>
        <select
          value={categoryFilter || ''}
          onChange={e => { setCategoryFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 min-w-[220px] focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {'\u00A0\u00A0'.repeat(cat.level)}{cat.level > 0 ? '└ ' : ''}{cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Package className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Товары не найдены</p>
          <p className="text-sm">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-500">
            Страница {page} из {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={p === page ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-slate-200'}
                >
                  {p}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers for building save payload from AI result
function _buildPayloadFromFilled(filled: Record<string, unknown> | undefined | null): Record<string, unknown>[] {
  if (!filled) return []
  return Object.entries(filled).map(([attrId, value]) => {
    const payload: Record<string, unknown> = { mp_attribute_id: Number(attrId) }
    if (Array.isArray(value)) payload.value_options = value
    else if (typeof value === 'number') payload.value_int = value  // Will be corrected by backend based on attr type
    else if (typeof value === 'string') payload.value_string = value
    else if (typeof value === 'boolean') payload.value_boolean = value
    return payload
  })
}

function _buildVariantPayload(filled: Record<string, Record<string, unknown>> | undefined | null): Record<string, unknown>[] {
  if (!filled) return []
  const result: Record<string, unknown>[] = []
  for (const [variantId, attrs] of Object.entries(filled)) {
    for (const [attrId, value] of Object.entries(attrs)) {
      const payload: Record<string, unknown> = { mp_attribute_id: Number(attrId), variant_id: Number(variantId) }
      if (Array.isArray(value)) payload.value_options = value
      else if (typeof value === 'number') payload.value_int = value
      else if (typeof value === 'string') payload.value_string = value
      else if (typeof value === 'boolean') payload.value_boolean = value
      result.push(payload)
    }
  }
  return result
}

function _buildSizePayload(filled: Record<string, Record<string, unknown>> | undefined | null): Record<string, unknown>[] {
  if (!filled) return []
  const result: Record<string, unknown>[] = []
  for (const [vsId, attrs] of Object.entries(filled)) {
    for (const [attrId, value] of Object.entries(attrs)) {
      const payload: Record<string, unknown> = { mp_attribute_id: Number(attrId), variant_size_id: Number(vsId) }
      if (Array.isArray(value)) payload.value_options = value
      else if (typeof value === 'number') payload.value_int = value
      else if (typeof value === 'string') payload.value_string = value
      else if (typeof value === 'boolean') payload.value_boolean = value
      result.push(payload)
    }
  }
  return result
}

function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-4 bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      {/* Image */}
      <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
        {product.first_image ? (
          <img src={product.first_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-slate-300" />
          </div>
        )}
      </div>

      {/* Info + price inline */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
            {product.name}
          </h3>
          {product.promo_price ? (
            <span className="shrink-0 text-sm font-bold text-red-500">
              {product.promo_price} <span className="text-xs font-normal line-through text-slate-400 ml-1">{product.price}</span>
            </span>
          ) : (
            <span className="shrink-0 text-sm font-bold text-slate-700">{product.price} грн</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
          <span className="text-indigo-600 font-medium">{product.category_name}</span>
          {product.brand_name && (
            <>
              <span className="text-slate-300">·</span>
              <span>{product.brand_name}</span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span>{product.variants_count} вар.</span>
        </div>
      </div>

      {/* Marketplace status */}
      <div className="flex items-center gap-2 shrink-0">
        {Object.entries(product.marketplace_status).map(([slug, mp]) => {
          const cfg = STATUS_CONFIG[mp.status] || STATUS_CONFIG.no_mapping
          return (
            <div
              key={slug}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span>{mp.name}</span>
              {mp.filled !== undefined && (
                <span className="opacity-70">{mp.filled}/{mp.required}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
    </Link>
  )
}
