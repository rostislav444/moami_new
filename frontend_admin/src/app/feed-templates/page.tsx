'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplacesAPI, feedTemplatesAPI, type Marketplace, type FeedTemplate } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Eye, Code, FileCode, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Monaco Editor (client-side only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const TEMPLATE_TYPES = [
  { value: 'header', label: 'Шапка (Header)', description: 'Начало XML файла' },
  { value: 'product', label: 'Товар (Product)', description: 'Шаблон товара' },
  { value: 'variant', label: 'Вариант (Variant)', description: 'Шаблон варианта товара' },
  { value: 'footer', label: 'Подвал (Footer)', description: 'Конец XML файла' },
];

const DEFAULT_TEMPLATES = {
  header: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <shop>
    <name>{{ shop_name }}</name>
    <company>{{ company_name }}</company>
    <url>{{ shop_url }}</url>
  </shop>
  <offers>`,
  product: `    <offer id="{{ product.id }}" available="{{ product.available }}">
      <name>{{ product.name }}</name>
      <url>{{ product.url }}</url>
      <price>{{ product.price }}</price>
      <currencyId>UAH</currencyId>
      <categoryId>{{ product.category_code }}</categoryId>
      <picture>{{ product.image }}</picture>
      <description><![CDATA[{{ product.description }}]]></description>
      {% for attr in product.attributes %}
      <param name="{{ attr.name }}">{{ attr.value }}</param>
      {% endfor %}
    </offer>`,
  variant: `    <offer id="{{ variant.id }}" group_id="{{ product.id }}" available="{{ variant.available }}">
      <name>{{ product.name }} - {{ variant.color }} {{ variant.size }}</name>
      <url>{{ variant.url }}</url>
      <price>{{ variant.price }}</price>
      <currencyId>UAH</currencyId>
      <categoryId>{{ product.category_code }}</categoryId>
      <picture>{{ variant.image }}</picture>
      <param name="Цвет">{{ variant.color }}</param>
      <param name="Размер">{{ variant.size }}</param>
    </offer>`,
  footer: `  </offers>
</catalog>`,
};

export default function FeedTemplatesPage() {
  const [selectedMarketplace, setSelectedMarketplace] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('header');
  const [editingTemplate, setEditingTemplate] = useState<Partial<FeedTemplate> | null>(null);
  const [previewXml, setPreviewXml] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch marketplaces
  const { data: marketplaces } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
  });

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['feed-templates', selectedMarketplace],
    queryFn: () => feedTemplatesAPI.list(selectedMarketplace!),
    enabled: !!selectedMarketplace,
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: (template: Partial<FeedTemplate>) => {
      if (template.id) {
        return feedTemplatesAPI.update(template.id, template);
      }
      return feedTemplatesAPI.create({ ...template, marketplace: selectedMarketplace! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-templates'] });
      setEditingTemplate(null);
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: () => feedTemplatesAPI.preview(selectedMarketplace!),
    onSuccess: (data) => {
      setPreviewXml(data.xml);
    },
  });

  // Get template by type
  const getTemplateByType = (type: string): FeedTemplate | undefined => {
    return templates?.find((t) => t.template_type === type);
  };

  // Handle edit
  const handleEdit = (type: string) => {
    const existing = getTemplateByType(type);
    if (existing) {
      setEditingTemplate(existing);
    } else {
      setEditingTemplate({
        template_type: type as FeedTemplate['template_type'],
        name: TEMPLATE_TYPES.find((t) => t.value === type)?.label || type,
        content: DEFAULT_TEMPLATES[type as keyof typeof DEFAULT_TEMPLATES] || '',
        is_active: true,
      });
    }
  };

  // Handle save
  const handleSave = () => {
    if (editingTemplate) {
      saveMutation.mutate(editingTemplate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Шаблоны фидов</h1>
          <p className="text-muted-foreground">
            Настройка XML шаблонов для генерации фидов
          </p>
        </div>
      </div>

      {/* Marketplace selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выберите маркетплейс</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <Select
            value={selectedMarketplace?.toString() || ''}
            onValueChange={(v) => {
              setSelectedMarketplace(Number(v));
              setEditingTemplate(null);
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Выберите маркетплейс" />
            </SelectTrigger>
            <SelectContent>
              {marketplaces?.map((mp) => (
                <SelectItem key={mp.id} value={mp.id.toString()}>
                  {mp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMarketplace && (
        <div className="grid grid-cols-[300px,1fr] gap-6">
          {/* Template types list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Типы шаблонов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATE_TYPES.map((type) => {
                const existing = getTemplateByType(type.value);
                return (
                  <div
                    key={type.value}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-colors
                      ${editingTemplate?.template_type === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}
                    `}
                    onClick={() => handleEdit(type.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      {existing ? (
                        <Badge variant="default">Настроен</Badge>
                      ) : (
                        <Badge variant="outline">Не настроен</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {editingTemplate
                    ? `Редактирование: ${editingTemplate.name || 'Новый шаблон'}`
                    : 'Выберите шаблон для редактирования'}
                </CardTitle>
                {editingTemplate && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewMutation.mutate()}
                      disabled={previewMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Превью
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Сохранить
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingTemplate ? (
                <Tabs defaultValue="editor">
                  <TabsList>
                    <TabsTrigger value="editor">
                      <Code className="h-4 w-4 mr-1" />
                      Редактор
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-1" />
                      Превью
                    </TabsTrigger>
                    <TabsTrigger value="variables">
                      Переменные
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="mt-4">
                    <div className="border rounded-lg overflow-hidden">
                      <MonacoEditor
                        height="400px"
                        language="xml"
                        theme="vs-dark"
                        value={editingTemplate.content || ''}
                        onChange={(value) =>
                          setEditingTemplate({ ...editingTemplate, content: value || '' })
                        }
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: 'on',
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/50">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {previewXml || 'Нажмите "Превью" для генерации'}
                      </pre>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="variables" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Общие переменные</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <code className="p-2 bg-muted rounded">{'{{ shop_name }}'}</code>
                          <span className="p-2">Название магазина</span>
                          <code className="p-2 bg-muted rounded">{'{{ shop_url }}'}</code>
                          <span className="p-2">URL магазина</span>
                          <code className="p-2 bg-muted rounded">{'{{ company_name }}'}</code>
                          <span className="p-2">Название компании</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Переменные товара</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <code className="p-2 bg-muted rounded">{'{{ product.id }}'}</code>
                          <span className="p-2">ID товара</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.name }}'}</code>
                          <span className="p-2">Название</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.price }}'}</code>
                          <span className="p-2">Цена</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.url }}'}</code>
                          <span className="p-2">URL товара</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.image }}'}</code>
                          <span className="p-2">Изображение</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.category_code }}'}</code>
                          <span className="p-2">Код категории маркетплейса</span>
                          <code className="p-2 bg-muted rounded">{'{{ product.description }}'}</code>
                          <span className="p-2">Описание</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Циклы и условия</h4>
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-muted rounded">
                            <code>{'{% for attr in product.attributes %}'}</code>
                            <p className="text-muted-foreground">Цикл по атрибутам товара</p>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <code>{'{% if product.discount %}...{% endif %}'}</code>
                            <p className="text-muted-foreground">Условный вывод</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Выберите шаблон из списка слева для редактирования
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
