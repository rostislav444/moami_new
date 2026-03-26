'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feedTemplatesAPI, type FeedTemplate } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Play,
  Download,
  ChevronDown,
  ChevronRight,
  FileCode,
  Eye,
  BookOpen,
} from 'lucide-react'

const TEMPLATE_TYPES = [
  { value: 'header', label: 'Header', description: 'Начало фида (XML declaration, открывающие теги, категории)' },
  { value: 'product', label: 'Product', description: 'Шаблон товара (итерация по вариантам/размерам)' },
  { value: 'variant', label: 'Variant', description: 'Шаблон варианта (опционально, вставляется как variants_xml)' },
  { value: 'footer', label: 'Footer', description: 'Конец фида (закрывающие теги)' },
]

export default function FeedTemplatesPage() {
  const { id } = useParams<{ id: string }>()
  const marketplaceId = Number(id)
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['feed-templates', marketplaceId],
    queryFn: () => feedTemplatesAPI.list(marketplaceId),
  })

  const [previewProductId, setPreviewProductId] = useState('')
  const [previewXml, setPreviewXml] = useState<string | null>(null)
  const [showVariables, setShowVariables] = useState(false)

  const { data: variables } = useQuery({
    queryKey: ['feed-variables'],
    queryFn: feedTemplatesAPI.variables,
    staleTime: Infinity,
  })

  const previewMutation = useMutation({
    mutationFn: () => feedTemplatesAPI.preview(marketplaceId, previewProductId ? Number(previewProductId) : undefined),
    onSuccess: (data) => setPreviewXml(data.xml),
  })

  const generateMutation = useMutation({
    mutationFn: () => feedTemplatesAPI.generate(marketplaceId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  // Group templates by type
  const templateMap: Record<string, FeedTemplate | undefined> = {}
  for (const t of templates) {
    templateMap[t.template_type] = t
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-indigo-500" />
          Шаблоны фида
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            {generateMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
            Сгенерировать фид
          </Button>
          <a
            href={feedTemplatesAPI.downloadUrl(marketplaceId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-3 w-3" />
              Скачать XML
            </Button>
          </a>
        </div>
      </div>

      {/* Generate result */}
      {generateMutation.data && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-sm">
          Фид сгенерирован: {generateMutation.data.products_count} товаров за {generateMutation.data.generation_time}с
          {generateMutation.data.file_path && (
            <span className="ml-2 text-slate-500">Сохранено: {generateMutation.data.file_path}</span>
          )}
        </div>
      )}

      {/* Template editors */}
      {TEMPLATE_TYPES.map(tt => (
        <TemplateEditor
          key={tt.value}
          marketplaceId={marketplaceId}
          templateType={tt.value}
          label={tt.label}
          description={tt.description}
          template={templateMap[tt.value]}
        />
      ))}

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-indigo-500" />
          Предпросмотр
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <Input
            value={previewProductId}
            onChange={e => setPreviewProductId(e.target.value)}
            placeholder="ID товара (пусто = первый)"
            className="w-48"
          />
          <Button
            size="sm"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {previewMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
            Предпросмотр
          </Button>
        </div>
        {previewXml && (
          <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
            {previewXml}
          </pre>
        )}
      </div>

      {/* Variables reference */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setShowVariables(!showVariables)}
          className="w-full flex items-center justify-between p-5"
        >
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            Справочник переменных
          </h3>
          {showVariables ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>
        {showVariables && variables && (
          <div className="px-5 pb-5 space-y-4">
            {Object.entries(variables).map(([section, vars]) => (
              <div key={section}>
                <h4 className="text-sm font-semibold text-indigo-600 mb-2 uppercase">{section}</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(vars as Record<string, string>).map(([key, desc]) => (
                    <div key={key} className="flex gap-2 py-1">
                      <code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {'{{ '}{key}{' }}'}
                      </code>
                      <span className="text-slate-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateEditor({
  marketplaceId,
  templateType,
  label,
  description,
  template,
}: {
  marketplaceId: number
  templateType: string
  label: string
  description: string
  template?: FeedTemplate
}) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState(template?.content || '')
  const [isOpen, setIsOpen] = useState(!!template?.content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (template?.id) {
        await feedTemplatesAPI.update(template.id, { content, is_active: true })
      } else {
        await feedTemplatesAPI.create({
          marketplace: marketplaceId,
          template_type: templateType as FeedTemplate['template_type'],
          name: label,
          content,
          is_active: true,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['feed-templates', marketplaceId] })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (template?.id && confirm('Удалить шаблон?')) {
      await feedTemplatesAPI.delete(template.id)
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['feed-templates', marketplaceId] })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{label}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template?.content ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Настроен</Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400">Пусто</Badge>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-64 bg-slate-900 text-green-400 rounded-lg p-4 text-xs font-mono resize-y border-0 focus:ring-2 focus:ring-indigo-500"
            placeholder={`<!-- ${label} template -->\n<!-- Используйте Django template syntax: {{ variable }}, {% for %} -->`}
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Django template syntax: {'{{ variable }}'}, {'{% for item in list %}'}, {'{% if condition %}'}
            </div>
            <div className="flex items-center gap-2">
              {template?.id && (
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-3 w-3 mr-1" /> Удалить
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
