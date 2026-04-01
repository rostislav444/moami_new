'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  productAdminAPI,
  marketplacesAPI,
  lookupsAPI,
  type ProductDetail,
  type VariantDetail,
  type VariantImage as VariantImageType,
  type VariantSizeDetail,
  type ProductComposition,
  type ProductAttribute,
  type MarketplaceFormData,
  type MarketplaceFormAttribute,
  type LookupItem,
  type LookupColor,
  type LookupCategory,
  type LookupSize,
  type LookupAttributeGroup,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Package,
  Tag,
  Palette,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  X,
} from 'lucide-react'

// =============================================================================
// Main page
// =============================================================================

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => productAdminAPI.get(productId),
    staleTime: 60_000,
  })

  const { data: marketplaces = [] } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
    staleTime: 120_000,
  })

  const activeMarketplaces = marketplaces.filter(m => m.is_active)
  const [activeTab, setActiveTab] = useState<string>('info')

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900">Товар не найден</h2>
      </div>
    )
  }

  const tabs = [
    { key: 'info', label: 'Основное' },
    ...activeMarketplaces.map(mp => ({ key: `mp-${mp.id}`, label: mp.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Товары
      </Link>

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left sidebar - product info */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Product image */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {product.variants[0]?.first_image ? (
              <img
                src={product.variants[0].first_image}
                alt=""
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-100 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-slate-300" />
              </div>
            )}
          </div>

          {/* Product info card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h1 className="font-bold text-slate-900 leading-tight">{product.name}</h1>

            <div className="flex flex-wrap gap-1.5">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{product.category_name}</Badge>
              {product.brand_name && (
                <Badge variant="outline" className="border-slate-200">{product.brand_name}</Badge>
              )}
              {product.code && (
                <Badge variant="outline" className="font-mono border-slate-200">{product.code}</Badge>
              )}
            </div>

            {/* Price */}
            <div className="pt-1">
              {product.promo_price ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-500">{product.promo_price}</span>
                  <span className="text-sm line-through text-slate-400">{product.price}</span>
                  <span className="text-sm text-slate-500">грн</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{product.price}</span>
                  <span className="text-sm text-slate-500">грн</span>
                </div>
              )}
            </div>

            {product.country_name && (
              <div className="text-sm text-slate-500">
                Страна: <span className="text-slate-700">{product.country_name}</span>
              </div>
            )}
          </div>

          {/* Variants list */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Варианты ({product.variants.length})
            </h3>
            <div className="space-y-2">
              {product.variants.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  {v.first_image ? (
                    <img src={v.first_image} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                      <Palette className="h-3 w-3 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-700">{v.code}</div>
                    <div className="text-xs text-slate-500">{v.color_name} · {v.sizes.length} разм.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex gap-1 p-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'info' && <ProductEditTab productId={productId} product={product} />}
          {activeTab.startsWith('mp-') && (
            <MarketplaceForm
              productId={productId}
              marketplaceId={Number(activeTab.replace('mp-', ''))}
              product={product}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Editable product info tab
// =============================================================================

interface EditState {
  name: string
  code: string
  category: number | null
  brand: number | null
  country: number | null
  price: number
  promo_price: number
  old_price: number
  description: string
  extra_description: string
  compositions: { id?: number; composition_id: number; composition_name: string; value: number }[]
  our_attributes: {
    id?: number
    attribute_group_id: number
    attribute_group_name: string
    data_type: string
    value_single_attribute: number | null
    value_multi_attributes: number[]
    value_int: number | null
    value_str: string | null
  }[]
  variants: EditVariant[]
  deleted_variant_ids: number[]
  deleted_size_ids: number[]
  deleted_image_ids: number[]
  image_reorders: { variant_id: number; image_ids: number[] }[]
}

interface EditVariant {
  id?: number
  code: string
  color_id: number | null
  color_name: string
  images: VariantImageType[]
  sizes: EditSize[]
  _isNew?: boolean
}

interface EditSize {
  id?: number
  size_id: number | null
  size_name: string
  max_size_id: number | null
  stock: number
  sku: string
  _isNew?: boolean
}

function initEditState(product: ProductDetail): EditState {
  return {
    name: product.name,
    code: product.code || '',
    category: product.category,
    brand: product.brand,
    country: product.country,
    price: product.price,
    promo_price: product.promo_price || 0,
    old_price: product.old_price || 0,
    description: product.description || '',
    extra_description: product.extra_description || '',
    compositions: product.compositions.map(c => ({
      id: c.id,
      composition_id: c.composition,
      composition_name: c.composition_name,
      value: c.value,
    })),
    our_attributes: product.attributes.map(a => ({
      id: a.id,
      attribute_group_id: a.attribute_group,
      attribute_group_name: a.attribute_group_name,
      data_type: a.data_type,
      value_single_attribute: a.value_single_attribute,
      value_multi_attributes: a.value_multi_attributes,
      value_int: a.value_int,
      value_str: a.value_str,
    })),
    variants: product.variants.map(v => ({
      id: v.id,
      code: v.code,
      color_id: v.color,
      color_name: v.color_name,
      images: [...v.images],
      sizes: v.sizes.map(s => ({
        id: s.id,
        size_id: s.size,
        size_name: s.size_name,
        max_size_id: s.max_size,
        stock: s.stock,
        sku: s.sku,
      })),
    })),
    deleted_variant_ids: [],
    deleted_size_ids: [],
    deleted_image_ids: [],
    image_reorders: [],
  }
}

function ProductEditTab({ productId, product }: { productId: number; product: ProductDetail }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<EditState>(() => initEditState(product))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [expandedVariants, setExpandedVariants] = useState<Set<number | string>>(new Set())
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [showAttributes, setShowAttributes] = useState(false)
  const [aiFilling, setAiFilling] = useState(false)
  const [aiReasoning, setAiReasoning] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Reset state when product changes
  useEffect(() => {
    setState(initEditState(product))
  }, [product])

  // Lookups
  const { data: brands = [] } = useQuery({
    queryKey: ['lookup-brands'],
    queryFn: lookupsAPI.brands,
    staleTime: 300_000,
  })
  const { data: countries = [] } = useQuery({
    queryKey: ['lookup-countries'],
    queryFn: lookupsAPI.countries,
    staleTime: 300_000,
  })
  const { data: colors = [] } = useQuery({
    queryKey: ['lookup-colors'],
    queryFn: lookupsAPI.colors,
    staleTime: 300_000,
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['lookup-categories'],
    queryFn: lookupsAPI.categories,
    staleTime: 300_000,
  })
  const { data: compositions = [] } = useQuery({
    queryKey: ['lookup-compositions'],
    queryFn: lookupsAPI.compositions,
    staleTime: 300_000,
  })

  const selectedCategory = categories.find(c => c.id === state.category)
  const sizeGroupId = selectedCategory?.size_group_id

  const { data: sizes = [] } = useQuery({
    queryKey: ['lookup-sizes', sizeGroupId],
    queryFn: () => lookupsAPI.sizes(sizeGroupId!),
    enabled: !!sizeGroupId,
    staleTime: 300_000,
  })

  const { data: attributeGroups = [] } = useQuery({
    queryKey: ['lookup-attr-groups', state.category],
    queryFn: () => lookupsAPI.attributeGroups(state.category!),
    enabled: !!state.category,
    staleTime: 300_000,
  })

  const update = useCallback((patch: Partial<EditState>) => {
    setState(prev => ({ ...prev, ...patch }))
    setSaveSuccess(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await productAdminAPI.saveAll(productId, {
        name: state.name,
        code: state.code,
        category: state.category || undefined,
        brand: state.brand || undefined,
        country: state.country || undefined,
        price: state.price,
        promo_price: state.promo_price,
        old_price: state.old_price,
        description: state.description,
        extra_description: state.extra_description,
        compositions: state.compositions.map(c => ({
          composition_id: c.composition_id,
          value: c.value,
        })),
        our_attributes: state.our_attributes.map(a => ({
          attribute_group_id: a.attribute_group_id,
          value_single_attribute: a.value_single_attribute,
          value_multi_attributes: a.value_multi_attributes,
          value_int: a.value_int,
          value_str: a.value_str,
        })),
        variants: state.variants.map(v => ({
          id: v.id,
          code: v.code,
          color_id: v.color_id || undefined,
          sizes: v.sizes.map(s => ({
            id: s.id,
            size_id: s.size_id || undefined,
            max_size_id: s.max_size_id,
            stock: s.stock,
          })),
        })),
        deleted_variant_ids: state.deleted_variant_ids,
        deleted_size_ids: state.deleted_size_ids,
        deleted_image_ids: state.deleted_image_ids,
        image_reorders: state.image_reorders,
      })
      setSaveSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const toggleVariant = (key: number | string) => {
    setExpandedVariants(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleAiFill = async () => {
    setAiFilling(true)
    setAiReasoning(null)
    setAiError(null)
    try {
      const res = await productAdminAPI.aiFillBase(productId)
      if (res.success && res.data) {
        const d = res.data
        const patch: Partial<EditState> = {}

        if (d.description) {
          patch.description = d.description
        }

        if (d.compositions && d.compositions.length > 0) {
          patch.compositions = d.compositions.map(c => ({
            composition_id: c.composition_id,
            composition_name: compositions.find(x => x.id === c.composition_id)?.name || '',
            value: c.value,
          }))
        }

        if (d.our_attributes && d.our_attributes.length > 0) {
          // Merge: keep existing that AI didn't touch, override what AI filled
          const aiGroupIds = new Set(d.our_attributes.map(a => a.attribute_group_id))
          const kept = state.our_attributes.filter(a => !aiGroupIds.has(a.attribute_group_id))
          const aiAttrs = d.our_attributes.map(a => {
            const ag = attributeGroups.find(g => g.id === a.attribute_group_id)
            return {
              attribute_group_id: a.attribute_group_id,
              attribute_group_name: ag?.name || '',
              data_type: ag?.data_type || '',
              value_single_attribute: a.value_single_attribute || null,
              value_multi_attributes: a.value_multi_attributes || [],
              value_int: a.value_int ?? null,
              value_str: a.value_str ?? null,
            }
          })
          patch.our_attributes = [...kept, ...aiAttrs]
        }

        update(patch)
        if (d.reasoning) setAiReasoning(d.reasoning)
      } else if (res.error) {
        setAiError(res.error)
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Ошибка AI')
    } finally {
      setAiFilling(false)
    }
  }

  // Build flat category options with indent
  const categoryOptions = categories.map(c => ({
    id: c.id,
    name: '\u00A0\u00A0'.repeat(c.level) + c.name,
  }))

  const inputClass = "border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"

  return (
    <div className="space-y-4">
      {/* Save bar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3">
        <div className="text-sm text-slate-500">
          Редактирование товара
        </div>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-sm text-red-500">{saveError}</span>}
          {saveSuccess && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Сохранено
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiFill}
            disabled={aiFilling}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            {aiFilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            AI по фото
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      {/* AI result */}
      {aiReasoning && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 text-sm text-indigo-800">
          AI: {aiReasoning}
        </div>
      )}
      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-800">
          Ошибка AI: {aiError}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-indigo-500" />
          Основные данные
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Название</label>
            <Input
              value={state.name}
              onChange={e => update({ name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Код товара</label>
            <Input
              value={state.code}
              onChange={e => update({ code: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Категория</label>
            <SearchableSelect
              options={categoryOptions}
              value={state.category}
              onChange={val => update({ category: val })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Бренд</label>
              <SearchableSelect
                options={brands}
                value={state.brand}
                onChange={val => update({ brand: val })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Страна</label>
              <SearchableSelect
                options={countries}
                value={state.country}
                onChange={val => update({ country: val })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Описание</label>
            <textarea
              value={state.description}
              onChange={e => update({ description: e.target.value })}
              className={`w-full px-3 py-2 text-sm min-h-[100px] ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Дополнительное описание</label>
            <textarea
              value={state.extra_description}
              onChange={e => update({ extra_description: e.target.value })}
              className={`w-full px-3 py-2 text-sm min-h-[80px] ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-indigo-500" />
          Цены
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Цена</label>
            <Input
              type="number"
              value={state.price || ''}
              onChange={e => update({ price: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Акционная</label>
            <Input
              type="number"
              value={state.promo_price || ''}
              onChange={e => update({ promo_price: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Старая</label>
            <Input
              type="number"
              value={state.old_price || ''}
              onChange={e => update({ old_price: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Compositions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-indigo-500" />
          Состав ткани
        </h3>
        <div className="space-y-2">
          {state.compositions.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1">
                <SearchableSelect
                  options={compositions}
                  value={comp.composition_id}
                  onChange={val => {
                    const next = [...state.compositions]
                    const name = compositions.find(c => c.id === val)?.name || ''
                    next[idx] = { ...next[idx], composition_id: val || 0, composition_name: name }
                    update({ compositions: next })
                  }}
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  value={comp.value || ''}
                  onChange={e => {
                    const next = [...state.compositions]
                    next[idx] = { ...next[idx], value: Number(e.target.value) || 0 }
                    update({ compositions: next })
                  }}
                  placeholder="%"
                  className={inputClass}
                />
              </div>
              <button
                onClick={() => {
                  const next = state.compositions.filter((_, i) => i !== idx)
                  update({ compositions: next })
                }}
                className="p-1.5 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => update({
              compositions: [...state.compositions, { composition_id: 0, composition_name: '', value: 0 }],
            })}
            className="border-dashed"
          >
            <Plus className="h-3 w-3 mr-1" /> Добавить
          </Button>
        </div>
      </div>

      {/* Our attributes */}
      {attributeGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setShowAttributes(!showAttributes)}
            className="w-full flex items-center justify-between p-5"
          >
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-500" />
              Характеристики
              <span className="text-sm font-normal text-slate-400">({attributeGroups.length})</span>
            </h3>
            {showAttributes ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {showAttributes && (
          <div className="space-y-4 px-5 pb-5">
            {attributeGroups.map(ag => {
              const existing = state.our_attributes.find(a => a.attribute_group_id === ag.id)
              return (
                <OurAttributeField
                  key={ag.id}
                  group={ag}
                  value={existing || null}
                  onChange={val => {
                    const next = state.our_attributes.filter(a => a.attribute_group_id !== ag.id)
                    if (val) next.push(val)
                    update({ our_attributes: next })
                  }}
                />
              )
            })}
          </div>
          )}
        </div>
      )}

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-500" />
            Варианты ({state.variants.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddVariant(true)}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Добавить вариант
          </Button>
        </div>

        {state.variants.map((variant, vIdx) => {
          const vKey = variant.id || `new-${vIdx}`
          const isExpanded = expandedVariants.has(vKey)

          return (
            <div key={vKey} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleVariant(vKey)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                {variant.images[0]?.thumbnail ? (
                  <img src={variant.images[0].thumbnail} alt="" className="w-10 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-slate-300" />
                  </div>
                )}
                <div className="text-left">
                  <span className="font-semibold text-slate-900">{variant.code}</span>
                  <span className="text-slate-500 ml-2">{variant.color_name}</span>
                  {variant._isNew && <Badge className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">Новый</Badge>}
                </div>
                <span className="ml-auto text-xs text-slate-400">{variant.images.length} фото · {variant.sizes.length} разм.</span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  <VariantEditor
                    variant={variant}
                    vIdx={vIdx}
                    colors={colors}
                    sizes={sizes}
                    productId={productId}
                    state={state}
                    update={update}
                    inputClass={inputClass}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add variant modal */}
      {showAddVariant && (
        <AddVariantModal
          colors={colors}
          onAdd={(code, colorId) => {
            const color = colors.find(c => c.id === colorId)
            update({
              variants: [
                ...state.variants,
                {
                  code,
                  color_id: colorId,
                  color_name: color?.name || '',
                  images: [],
                  sizes: [],
                  _isNew: true,
                },
              ],
            })
            setShowAddVariant(false)
          }}
          onClose={() => setShowAddVariant(false)}
        />
      )}

      {/* Bottom save bar */}
      <div className="flex items-center justify-end bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Сохранить
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Variant editor
// =============================================================================

function VariantEditor({
  variant,
  vIdx,
  colors,
  sizes,
  productId,
  state,
  update,
  inputClass,
}: {
  variant: EditVariant
  vIdx: number
  colors: LookupColor[]
  sizes: LookupSize[]
  productId: number
  state: EditState
  update: (patch: Partial<EditState>) => void
  inputClass: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const updateVariant = (patch: Partial<EditVariant>) => {
    const next = [...state.variants]
    next[vIdx] = { ...next[vIdx], ...patch }
    update({ variants: next })
  }

  const handleImageUpload = async (files: FileList) => {
    if (!variant.id) return // Can't upload for unsaved variants
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const img = await productAdminAPI.uploadImage(productId, variant.id, file)
        updateVariant({ images: [...variant.images, img] })
      }
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = (imgId: number) => {
    updateVariant({ images: variant.images.filter(i => i.id !== imgId) })
    update({ deleted_image_ids: [...state.deleted_image_ids, imgId] })
  }

  const deleteVariant = () => {
    const next = state.variants.filter((_, i) => i !== vIdx)
    if (variant.id) {
      update({ variants: next, deleted_variant_ids: [...state.deleted_variant_ids, variant.id] })
    } else {
      update({ variants: next })
    }
  }

  const addSize = () => {
    updateVariant({
      sizes: [...variant.sizes, { size_id: null, size_name: '', max_size_id: null, stock: 1, sku: '', _isNew: true }],
    })
  }

  const updateSize = (sIdx: number, patch: Partial<EditSize>) => {
    const next = [...variant.sizes]
    next[sIdx] = { ...next[sIdx], ...patch }
    updateVariant({ sizes: next })
  }

  const deleteSize = (sIdx: number) => {
    const size = variant.sizes[sIdx]
    const next = variant.sizes.filter((_, i) => i !== sIdx)
    updateVariant({ sizes: next })
    if (size.id) {
      update({ deleted_size_ids: [...state.deleted_size_ids, size.id] })
    }
  }

  const colorOptions = colors.map(c => ({ id: c.id, name: c.name }))
  const sizeOptions = sizes.map(s => ({ id: s.id, name: s.name }))

  return (
    <>
      {/* Code + Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Код</label>
          <Input
            value={variant.code}
            onChange={e => updateVariant({ code: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Цвет</label>
          <SearchableSelect
            options={colorOptions}
            value={variant.color_id}
            onChange={val => {
              const color = colors.find(c => c.id === val)
              updateVariant({ color_id: val, color_name: color?.name || '' })
            }}
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Изображения ({variant.images.length})
        </label>
        <div className="flex flex-wrap gap-3">
          {variant.images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.thumbnail || img.url || ''}
                alt=""
                className="w-24 h-36 rounded-lg object-cover border border-slate-200"
              />
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {img.exclude_at_marketplace && (
                <div className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1 rounded">
                  MP
                </div>
              )}
            </div>
          ))}

          {/* Upload button */}
          {variant.id && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-36 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] mt-1">Загрузить</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleImageUpload(e.target.files)}
          />
        </div>
        {!variant.id && (
          <p className="text-xs text-slate-400 mt-1">Сохраните товар, чтобы загрузить изображения для нового варианта</p>
        )}
      </div>

      {/* Sizes */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Размеры ({variant.sizes.length})
        </label>
        {variant.sizes.length > 0 && (
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-[1fr_1fr_80px_120px_32px] gap-2 text-xs text-slate-500 font-medium px-1">
              <span>Размер</span>
              <span>Макс. размер</span>
              <span>Остаток</span>
              <span>SKU</span>
              <span></span>
            </div>
            {variant.sizes.map((s, sIdx) => (
              <div key={s.id || `new-${sIdx}`} className="grid grid-cols-[1fr_1fr_80px_120px_32px] gap-2 items-center">
                <SearchableSelect
                  options={sizeOptions}
                  value={s.size_id}
                  onChange={val => {
                    const name = sizes.find(sz => sz.id === val)?.name || ''
                    updateSize(sIdx, { size_id: val, size_name: name })
                  }}
                />
                <SearchableSelect
                  options={sizeOptions}
                  value={s.max_size_id}
                  onChange={val => updateSize(sIdx, { max_size_id: val })}
                />
                <Input
                  type="number"
                  value={s.stock}
                  onChange={e => updateSize(sIdx, { stock: Number(e.target.value) || 0 })}
                  className={`${inputClass} h-9`}
                />
                <span className="text-xs text-slate-400 font-mono truncate">{s.sku}</span>
                <button onClick={() => deleteSize(sIdx)} className="p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={addSize} className="border-dashed">
          <Plus className="h-3 w-3 mr-1" /> Добавить размер
        </Button>
      </div>

      {/* Delete variant */}
      <div className="pt-2 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={deleteVariant}
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3 mr-1" /> Удалить вариант
        </Button>
      </div>
    </>
  )
}

// =============================================================================
// Our attribute field
// =============================================================================

function OurAttributeField({
  group,
  value,
  onChange,
}: {
  group: LookupAttributeGroup
  value: {
    attribute_group_id: number
    attribute_group_name: string
    data_type: string
    value_single_attribute: number | null
    value_multi_attributes: number[]
    value_int: number | null
    value_str: string | null
  } | null
  onChange: (val: {
    attribute_group_id: number
    attribute_group_name: string
    data_type: string
    value_single_attribute: number | null
    value_multi_attributes: number[]
    value_int: number | null
    value_str: string | null
  } | null) => void
}) {
  const inputClass = "border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
  const label = (
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1.5">
      {group.name}
      {group.required && <span className="text-red-500">*</span>}
    </label>
  )

  const makeVal = (patch: Partial<{
    value_single_attribute: number | null
    value_multi_attributes: number[]
    value_int: number | null
    value_str: string | null
  }>) => ({
    attribute_group_id: group.id,
    attribute_group_name: group.name,
    data_type: group.data_type,
    value_single_attribute: value?.value_single_attribute || null,
    value_multi_attributes: value?.value_multi_attributes || [],
    value_int: value?.value_int || null,
    value_str: value?.value_str || null,
    ...patch,
  })

  const attrOptions = group.attributes.map(a => ({ id: a.id, name: a.name }))

  switch (group.data_type) {
    case 'single_attr':
      return (
        <div>
          {label}
          <SearchableSelect
            options={attrOptions}
            value={value?.value_single_attribute || null}
            onChange={val => onChange(makeVal({ value_single_attribute: val }))}
          />
        </div>
      )
    case 'multi_attr':
      return (
        <div>
          {label}
          <SearchableMultiSelect
            options={attrOptions}
            value={value?.value_multi_attributes || []}
            onChange={val => onChange(makeVal({ value_multi_attributes: val }))}
          />
        </div>
      )
    case 'integer':
      return (
        <div>
          {label}
          <Input
            type="number"
            value={value?.value_int ?? ''}
            onChange={e => onChange(makeVal({ value_int: e.target.value ? Number(e.target.value) : null }))}
            className={inputClass}
          />
        </div>
      )
    case 'sting': // typo in model
      return (
        <div>
          {label}
          <Input
            value={value?.value_str || ''}
            onChange={e => onChange(makeVal({ value_str: e.target.value }))}
            className={inputClass}
          />
        </div>
      )
    default:
      return null
  }
}

// =============================================================================
// Add variant modal
// =============================================================================

function AddVariantModal({
  colors,
  onAdd,
  onClose,
}: {
  colors: LookupColor[]
  onAdd: (code: string, colorId: number) => void
  onClose: () => void
}) {
  const [code, setCode] = useState('')
  const [colorId, setColorId] = useState<number | null>(null)
  const inputClass = "border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-semibold text-slate-900">Добавить вариант</h3>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Код варианта</label>
          <Input value={code} onChange={e => setCode(e.target.value)} className={inputClass} placeholder="Напр. ABC-123" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Цвет</label>
          <SearchableSelect
            options={colors.map(c => ({ id: c.id, name: c.name }))}
            value={colorId}
            onChange={setColorId}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Отмена</Button>
          <Button
            size="sm"
            disabled={!code || !colorId}
            onClick={() => code && colorId && onAdd(code, colorId)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Добавить
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Marketplace form (kept from original)
// =============================================================================

function MarketplaceForm({
  productId,
  marketplaceId,
  product,
}: {
  productId: number
  marketplaceId: number
  product: ProductDetail
}) {
  const queryClient = useQueryClient()

  const { data: form, isLoading } = useQuery({
    queryKey: ['marketplace-form', productId, marketplaceId],
    queryFn: () => productAdminAPI.marketplaceForm(productId, marketplaceId),
    staleTime: 30_000,
  })

  const [productValues, setProductValues] = useState<Record<number, unknown>>({})
  const [variantValues, setVariantValues] = useState<Record<string, unknown>>({})
  const [sizeValues, setSizeValues] = useState<Record<string, unknown>>({})
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  // Load existing values from form data
  useEffect(() => {
    if (!form) return
    const pv: Record<number, unknown> = {}
    for (const attr of form.product_attributes) {
      const iv = getInitialValue(attr)
      if (iv !== undefined) pv[attr.mp_attribute_id] = iv
    }
    setProductValues(pv)

    const vv: Record<string, unknown> = {}
    const sv: Record<string, unknown> = {}
    for (const variant of form.variants) {
      for (const attr of variant.attributes) {
        const iv = getInitialValue(attr)
        if (iv !== undefined) vv[`${variant.variant_id}-${attr.mp_attribute_id}`] = iv
      }
      for (const size of variant.sizes) {
        const interps = (size as Record<string, unknown>).size_interpretations as Record<string, string> | undefined
        for (const attr of size.attributes) {
          const key = `${variant.variant_id}-${size.variant_size_id}-${attr.mp_attribute_id}`
          const iv = getInitialValue(attr)
          if (iv !== undefined) {
            sv[key] = iv
          } else if (interps && attr.options?.length && /размер|розмір|size|тр жіноч/i.test(attr.name)) {
            // Auto-match size from interpretations
            const matched = autoMatchSizeOption(attr, interps)
            if (matched !== null) sv[key] = matched
          }
        }
      }
    }
    setVariantValues(vv)
    setSizeValues(sv)
    setHasChanges(false)
  }, [form])

  const aiFillMutation = useMutation({
    mutationFn: (withImages: boolean = false) => productAdminAPI.aiFill(productId, marketplaceId, withImages),
    onSuccess: (data) => {
      if (!data.success) return
      const d = data as Record<string, unknown>

      // Product-level
      const filledProduct = d.filled_product as Record<string, unknown> | undefined
      if (filledProduct) {
        const newValues: Record<number, unknown> = {}
        for (const [attrId, value] of Object.entries(filledProduct)) {
          newValues[Number(attrId)] = value
        }
        setProductValues(prev => ({ ...prev, ...newValues }))
      }

      // Variant-level — per variant
      const filledVariants = d.filled_variants as Record<string, Record<string, unknown>> | undefined
      if (filledVariants && form?.variants) {
        const newVarValues: Record<string, unknown> = {}
        for (const variant of form.variants) {
          const vAttrs = filledVariants[String(variant.variant_id)]
          if (vAttrs) {
            for (const [attrId, value] of Object.entries(vAttrs)) {
              newVarValues[`${variant.variant_id}-${attrId}`] = value
            }
          }
        }
        setVariantValues(prev => ({ ...prev, ...newVarValues }))
      }

      // Size-level — per size
      const filledSizes = d.filled_sizes as Record<string, Record<string, unknown>> | undefined
      if (filledSizes && form?.variants) {
        const newSizeValues: Record<string, unknown> = {}
        for (const variant of form.variants) {
          for (const size of variant.sizes) {
            const sizeAttrs = filledSizes[String(size.variant_size_id)]
            if (sizeAttrs) {
              for (const [attrId, value] of Object.entries(sizeAttrs)) {
                newSizeValues[`${variant.variant_id}-${size.variant_size_id}-${attrId}`] = value
              }
            }
          }
        }
        setSizeValues(prev => ({ ...prev, ...newSizeValues }))
      }

      setHasChanges(true)
      setAutoSaveAfterAi(true)
    },
  })

  const [autoSaveAfterAi, setAutoSaveAfterAi] = useState(false)

  // Auto-save after AI fill — wait for state to settle then trigger save
  useEffect(() => {
    if (autoSaveAfterAi && hasChanges) {
      setAutoSaveAfterAi(false)
      saveMutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveAfterAi, hasChanges])

  // Build attr type map from form data for correct payload building
  const attrTypeMap: Record<number, string> = {}
  if (form) {
    for (const a of form.product_attributes) attrTypeMap[a.mp_attribute_id] = a.attr_type
    for (const v of form.variants) {
      for (const a of v.attributes) attrTypeMap[a.mp_attribute_id] = a.attr_type
      for (const s of v.sizes) {
        for (const a of s.attributes) attrTypeMap[a.mp_attribute_id] = a.attr_type
      }
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const productAttrs = Object.entries(productValues).map(([attrId, value]) =>
        buildAttrPayload(Number(attrId), value, attrTypeMap[Number(attrId)])
      )
      const variantAttrs = Object.entries(variantValues).map(([key, value]) => {
        const [variantId, attrId] = key.split('-').map(Number)
        return { variant_id: variantId, ...buildAttrPayload(attrId, value, attrTypeMap[attrId]) }
      })
      const sizeAttrs = Object.entries(sizeValues).map(([key, value]) => {
        const [variantId, sizeId, attrId] = key.split('-').map(Number)
        return { variant_id: variantId, variant_size_id: sizeId, ...buildAttrPayload(attrId, value, attrTypeMap[attrId]) }
      })
      return productAdminAPI.saveAttributes(productId, {
        marketplace_id: marketplaceId,
        product_attributes: productAttrs,
        variant_attributes: variantAttrs,
        size_attributes: sizeAttrs,
      })
    },
    onSuccess: () => {
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['marketplace-form', productId, marketplaceId] })
    },
  })

  const toggleVariant = (variantId: number) => {
    setExpandedVariants(prev => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!form) return null

  if (form.error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
        <p className="font-medium text-amber-800">{form.error}</p>
      </div>
    )
  }

  const formAny = form as unknown as Record<string, unknown>

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3">
        <div className="text-sm text-slate-500">
          Категория: <span className="font-medium text-slate-900">{form.mp_category_name}</span>
          {formAny.total_attributes ? (
            <span className="ml-3 text-slate-400">{String(formAny.total_attributes)} атрибутов</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => aiFillMutation.mutate(false)}
            disabled={aiFillMutation.isPending}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            {aiFillMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <span className="mr-2">AI</span>
            }
            AI заполнить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aiFillMutation.mutate(true)}
            disabled={aiFillMutation.isPending}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            {aiFillMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <ImageIcon className="mr-2 h-4 w-4" />
            }
            AI + фото
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saveMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />
            }
            Сохранить
          </Button>
        </div>
      </div>

      {/* AI result */}
      {aiFillMutation.data?.reasoning && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 text-sm text-indigo-800">
          AI: {aiFillMutation.data.reasoning}
        </div>
      )}
      {aiFillMutation.data?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-800">
          Ошибка AI: {aiFillMutation.data.error}
        </div>
      )}

      {/* Product-level attributes */}
      {form.product_attributes.length > 0 && (
        <AttributeSection
          title="Атрибуты товара"
          icon={<Package className="h-4 w-4 text-indigo-500" />}
          attributes={form.product_attributes}
          values={productValues}
          onChange={(attrId, val) => {
            setProductValues(prev => ({ ...prev, [attrId]: val }))
            setHasChanges(true)
          }}
        />
      )}

      {/* Brand */}
      {form.brand_attributes.length > 0 && (
        <AutoSection
          title="Бренд"
          icon={<Tag className="h-4 w-4 text-indigo-500" />}
          items={form.brand_attributes.map(a => ({
            name: a.name,
            ourValue: a.our_brand || '—',
            autoValue: a.auto_value?.entity_name || null,
          }))}
        />
      )}

      {/* Country */}
      {(() => {
        const countryAttrs = formAny.country_attributes as Array<Record<string, unknown>> | undefined
        if (!countryAttrs?.length) return null
        return (
          <AutoSection
            title="Страна"
            icon={<span className="text-indigo-500">G</span>}
            items={countryAttrs.map(a => ({
              name: a.name as string,
              ourValue: (a.our_country as string) || '—',
              autoValue: (a.auto_value as Record<string, unknown>)
                ? (a.auto_value as Record<string, unknown>).entity_name as string
                : null,
            }))}
          />
        )
      })()}

      {/* Composition */}
      {(() => {
        const compAttrs = formAny.composition_attributes as Array<Record<string, unknown>> | undefined
        if (!compAttrs?.length) return null
        return (
          <AutoSection
            title="Состав ткани"
            icon={<Info className="h-4 w-4 text-indigo-500" />}
            items={compAttrs.map(a => ({
              name: a.name as string,
              ourValue: (a.our_composition as string) || '—',
              autoValue: (a.auto_value as string) || null,
            }))}
          />
        )
      })()}

      {/* Variants */}
      {form.variants.length > 0 && (
        <div className="space-y-3">
          {form.variants.map(variant => (
            <div key={variant.variant_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleVariant(variant.variant_id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {expandedVariants.has(variant.variant_id)
                  ? <ChevronDown className="h-4 w-4 text-slate-400" />
                  : <ChevronRight className="h-4 w-4 text-slate-400" />
                }
                {variant.image_url ? (
                  <img src={variant.image_url} alt="" className="w-10 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-slate-300" />
                  </div>
                )}
                <div className="text-left">
                  <span className="font-semibold text-slate-900">{variant.code}</span>
                  <span className="text-slate-500 ml-2">{variant.color_name}</span>
                </div>
                <span className="ml-auto text-xs text-slate-400">{variant.sizes.length} размеров</span>
              </button>

              {expandedVariants.has(variant.variant_id) && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4" onClick={e => e.stopPropagation()}>
                  {/* Color auto */}
                  {(() => {
                    const vAny = variant as unknown as Record<string, unknown>
                    const colorAttrs = vAny.color_attributes as Array<Record<string, unknown>> | undefined
                    if (!colorAttrs?.length) return null
                    return (
                      <AutoSection
                        title="Цвет"
                        icon={<Palette className="h-4 w-4 text-indigo-500" />}
                        items={colorAttrs.map(a => ({
                          name: a.name as string,
                          ourValue: (a.our_color as string) || '—',
                          autoValue: (a.auto_value as Record<string, unknown>)
                            ? (a.auto_value as Record<string, unknown>).entity_name as string
                            : null,
                        }))}
                      />
                    )
                  })()}

                  {/* Variant attributes */}
                  {variant.attributes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Атрибуты варианта</h4>
                      <div className=" space-y-3">
                        {variant.attributes.map(attr => (
                          <AttributeField
                            key={attr.mp_attribute_id}
                            attr={attr}
                            value={variantValues[`${variant.variant_id}-${attr.mp_attribute_id}`]}
                            onChange={val => {
                              setVariantValues(prev => ({
                                ...prev,
                                [`${variant.variant_id}-${attr.mp_attribute_id}`]: val,
                              }))
                              setHasChanges(true)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {variant.sizes.some(s => s.attributes.length > 0) && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Размеры</h4>
                      {variant.sizes.map(size => (
                        <div key={size.variant_size_id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {size.size_name}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              SKU: {size.sku} · Остаток: {size.stock}
                            </span>
                          </div>
                          <div className=" space-y-3">
                            {size.attributes.map(attr => (
                              <AttributeField
                                key={attr.mp_attribute_id}
                                attr={attr}
                                value={sizeValues[`${variant.variant_id}-${size.variant_size_id}-${attr.mp_attribute_id}`]}
                                onChange={val => {
                                  setSizeValues(prev => ({
                                    ...prev,
                                    [`${variant.variant_id}-${size.variant_size_id}-${attr.mp_attribute_id}`]: val,
                                  }))
                                  setHasChanges(true)
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Reusable components
// =============================================================================

function AttributeSection({
  title,
  icon,
  attributes,
  values,
  onChange,
}: {
  title: string
  icon: React.ReactNode
  attributes: MarketplaceFormAttribute[]
  values: Record<number, unknown>
  onChange: (attrId: number, value: unknown) => void
}) {
  const required = attributes.filter(a => a.is_required)
  const optional = attributes.filter(a => !a.is_required)
  const [showOptional, setShowOptional] = useState(false)

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            {icon} {title}
          </h3>
          <div className="flex gap-2">
            <Badge className="bg-red-50 text-red-700 border-red-200">{required.length} обяз.</Badge>
            {optional.length > 0 && (
              <Badge className="bg-slate-50 text-slate-500 border-slate-200">{optional.length} опц.</Badge>
            )}
          </div>
        </div>
        <div className=" space-y-4">
          {required.map(attr => (
            <AttributeField
              key={attr.mp_attribute_id}
              attr={attr}
              value={values[attr.mp_attribute_id]}
              onChange={val => onChange(attr.mp_attribute_id, val)}
            />
          ))}
        </div>
      </div>

      {optional.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-dashed border-slate-200">
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {showOptional ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Опциональные ({optional.length})
          </button>
          {showOptional && (
            <div className="px-5 pb-5  space-y-4">
              {optional.map(attr => (
                <AttributeField
                  key={attr.mp_attribute_id}
                  attr={attr}
                  value={values[attr.mp_attribute_id]}
                  onChange={val => onChange(attr.mp_attribute_id, val)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AutoSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: { name: string; ourValue: string; autoValue: string | null }[]
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
        {icon} {title}
      </h3>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <span className="text-sm text-slate-500 w-44">{item.name}</span>
          <span className="text-sm text-slate-700">{item.ourValue}</span>
          {item.autoValue ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {item.autoValue}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-200 text-amber-600 ml-auto">
              Не замаплен
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}

function AttributeField({
  attr,
  value,
  onChange,
}: {
  attr: MarketplaceFormAttribute
  value: unknown
  onChange: (value: unknown) => void
}) {
  const currentVal = value !== undefined ? value : getInitialValue(attr)

  const label = (
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1.5">
      {attr.name}
      {attr.is_required && <span className="text-red-500">*</span>}
      {attr.suffix && <span className="text-xs text-slate-400 font-normal">({attr.suffix})</span>}
    </label>
  )

  const inputClass = "border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"

  switch (attr.attr_type) {
    case 'select':
      return (
        <div>
          {label}
          <SearchableSelect
            options={attr.options || []}
            value={(currentVal as number) || null}
            onChange={val => onChange(val)}
          />
        </div>
      )
    case 'multiselect':
      return (
        <div>
          {label}
          <SearchableMultiSelect
            options={attr.options || []}
            value={(currentVal as number[]) || []}
            onChange={val => onChange(val)}
          />
        </div>
      )
    case 'string':
      return (
        <div>
          {label}
          <Input
            value={(currentVal as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      )
    case 'text':
      return (
        <div>
          {label}
          <textarea
            value={(currentVal as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm min-h-[80px] ${inputClass}`}
          />
        </div>
      )
    case 'int':
      return (
        <div>
          {label}
          <Input
            type="number"
            value={(currentVal as number) ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          />
        </div>
      )
    case 'float':
      return (
        <div>
          {label}
          <Input
            type="number"
            step="0.01"
            value={(currentVal as number) ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          />
        </div>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-2.5 py-1">
          <input
            type="checkbox"
            checked={!!currentVal}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-700">
            {attr.name}
            {attr.is_required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      )
    default:
      return (
        <div>
          {label}
          <Input
            value={(currentVal as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      )
  }
}

// =============================================================================
// Searchable selects
// =============================================================================

function SearchableSelect({
  options,
  value,
  onChange,
}: {
  options: { id: number; name: string }[]
  value: number | null
  onChange: (value: number | null) => void
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const filtered = search
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).slice(0, 100)
    : options.slice(0, 100)

  const selectedName = options.find(o => o.id === value)?.name

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropUp = spaceBelow < 320
      setDropdownStyle({
        position: 'fixed',
        ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 50,
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-left flex items-center justify-between hover:bg-white focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selectedName ? 'text-slate-900 truncate' : 'text-slate-400'}>
          {selectedName || '— Выберите —'}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch('') }} />
          <div style={dropdownStyle} className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-[300px] overflow-hidden">
            {options.length > 10 && (
              <div className="p-2 border-b border-slate-100">
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="h-8 text-sm" autoFocus />
              </div>
            )}
            <div className="overflow-auto max-h-[250px]">
              <button type="button" onClick={() => { onChange(null); setIsOpen(false); setSearch('') }}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50">— Очистить —</button>
              {filtered.map(opt => (
                <button key={opt.id} type="button"
                  onClick={() => { onChange(opt.id); setIsOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 ${opt.id === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}`}>
                  {opt.name}
                </button>
              ))}
              {filtered.length === 0 && <div className="px-3 py-6 text-sm text-slate-400 text-center">Не найдено</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SearchableMultiSelect({
  options,
  value,
  onChange,
}: {
  options: { id: number; name: string }[]
  value: number[]
  onChange: (value: number[]) => void
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const filtered = search
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).slice(0, 100)
    : options.slice(0, 100)

  const selectedNames = options.filter(o => value.includes(o.id)).map(o => o.name)

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropUp = spaceBelow < 320
      setDropdownStyle({
        position: 'fixed',
        ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 50,
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-left min-h-[38px] hover:bg-white focus:ring-2 focus:ring-indigo-500">
        {selectedNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedNames.slice(0, 5).map(n => (
              <Badge key={n} className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{n}</Badge>
            ))}
            {selectedNames.length > 5 && <Badge variant="outline" className="text-xs">+{selectedNames.length - 5}</Badge>}
          </div>
        ) : (
          <span className="text-slate-400">Выберите...</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch('') }} />
          <div style={dropdownStyle} className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-[300px] overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="h-8 text-sm" autoFocus />
            </div>
            <div className="overflow-auto max-h-[250px]">
              {filtered.map(opt => (
                <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 ${value.includes(opt.id) ? 'bg-indigo-50' : ''}`}>
                  <input type="checkbox" checked={value.includes(opt.id)} readOnly className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600" />
                  <span className="text-slate-700">{opt.name}</span>
                </button>
              ))}
              {filtered.length === 0 && <div className="px-3 py-6 text-sm text-slate-400 text-center">Не найдено</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function buildAttrPayload(
  attrId: number,
  value: unknown,
  attrType?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { mp_attribute_id: attrId }

  // Use attr_type if known to correctly map values
  if (attrType) {
    switch (attrType) {
      case 'select':
        payload.value_option = typeof value === 'number' ? value : null
        break
      case 'multiselect':
        payload.value_options = Array.isArray(value) ? value : []
        break
      case 'string':
        payload.value_string = value != null ? String(value) : ''
        break
      case 'text':
        payload.value_text = value != null ? String(value) : ''
        break
      case 'int':
        payload.value_int = typeof value === 'number' ? value : (value ? Number(value) : null)
        break
      case 'float':
        payload.value_float = typeof value === 'number' ? value : (value ? Number(value) : null)
        break
      case 'boolean':
        payload.value_boolean = !!value
        break
      default:
        payload.value_string = value != null ? String(value) : ''
    }
    return payload
  }

  // Fallback: guess from JS type (legacy)
  if (Array.isArray(value)) payload.value_options = value
  else if (typeof value === 'number') payload.value_option = value
  else if (typeof value === 'string') payload.value_string = value
  else if (typeof value === 'boolean') payload.value_boolean = value
  else if (value !== null && value !== undefined) payload.value_string = String(value)
  return payload
}

function getInitialValue(attr: MarketplaceFormAttribute): unknown {
  if (!attr.current_value) return undefined
  const cv = attr.current_value as Record<string, unknown>
  return cv.value
}

function autoMatchSizeOption(attr: MarketplaceFormAttribute, interps: Record<string, string>): unknown {
  const options = attr.options || []
  if (!options.length) return null

  const nameLower = attr.name.toLowerCase()
  // Pick interpretation based on attr name
  let priorities: string[]
  if (nameLower.includes('международн') || nameLower.includes('3xs') || nameLower.includes('int')) {
    priorities = ['int', 'INT', 'ua', 'UA', 'eu', 'EU']
  } else if (nameLower.includes(' eu')) {
    priorities = ['eu', 'EU', 'ua', 'UA']
  } else {
    priorities = ['ua', 'UA', 'int', 'INT', 'eu', 'EU']
  }

  for (const key of priorities) {
    const val = interps[key]
    if (!val) continue
    const v = val.trim().toLowerCase()
    const match = options.find(o => o.name.trim().toLowerCase() === v)
    if (match) {
      return attr.attr_type === 'multiselect' ? [match.id] : match.id
    }
  }
  return null
}
