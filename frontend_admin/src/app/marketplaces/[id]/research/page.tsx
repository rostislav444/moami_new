'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { researchAPI, type AgentMessage, type AgentConversation } from '@/lib/research-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  User,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Paperclip,
  X,
  FolderTree,
  ListChecks,
  ArrowRight,
  Tags,
} from 'lucide-react';

// =============================================================================
// Preset research actions
// =============================================================================

interface ResearchPreset {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  systemContext: string;
  inputPlaceholder: string;
  inputHint: string;
}

const RESEARCH_PRESETS: ResearchPreset[] = [
  {
    id: 'categories',
    label: 'Загрузка категорий',
    description: 'Исследовать как загрузить дерево категорий',
    icon: <FolderTree className="h-5 w-5" />,
    color: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    systemContext: `Исследуй как загрузить категории этого маркетплейса.

Мне нужно знать:
1. Есть ли API для получения списка категорий? Эндпоинт, метод, параметры?
2. Категории загружаются списком или по одной (нужен parent_id)?
3. Структура ответа (JSON/XML)? Поля: id, name, parent_id, code?
4. Пагинация? Лимиты?
5. Иерархия (дерево или плоский список)?

По результатам сформируй pipeline шаги для загрузки.
ВАЖНО: Создай finding с типом "pipeline" содержащий готовые шаги которые можно запустить.`,
    inputPlaceholder: 'Добавьте ссылки на документацию, API, примеры...',
    inputHint: 'Дайте ссылки на документацию маркетплейса, примеры API, или прикрепите файлы. Потом нажмите "Начать исследование".',
  },
  {
    id: 'attributes',
    label: 'Загрузка атрибутов',
    description: 'Исследовать как загрузить атрибуты категорий',
    icon: <ListChecks className="h-5 w-5" />,
    color: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    systemContext: `Исследуй как загрузить атрибуты (характеристики товаров) для категорий этого маркетплейса.

Мне нужно знать:
1. Есть ли API для получения атрибутов категории? Эндпоинт, параметры?
2. Атрибуты привязаны к категориям? Нужно указывать category_id/code?
3. Структура: id, name, type (string/select/multiselect/int/float/boolean), обязательность, возможные значения?
4. По одной категории или все сразу?
5. Есть ли файлы (XLSX/CSV) с атрибутами для скачивания?

По результатам сформируй pipeline шаги для загрузки атрибутов. Категории уже загружены.
ВАЖНО: Создай finding с типом "pipeline" содержащий готовые шаги которые можно запустить.`,
    inputPlaceholder: 'Добавьте ссылки на документацию атрибутов, файлы XLSX...',
    inputHint: 'Дайте ссылки, прикрепите файлы с атрибутами (XLSX, CSV), или опишите как получить данные. Потом нажмите "Начать исследование".',
  },
  {
    id: 'attribute_options',
    label: 'Загрузка значений атрибутов',
    description: 'Исследовать как загрузить значения (опции) для select/multiselect атрибутов',
    icon: <Tags className="h-5 w-5" />,
    color: 'border-orange-200 bg-orange-50 hover:border-orange-400',
    systemContext: `Исследуй как загрузить значения (опции) для select/multiselect атрибутов этого маркетплейса.

Контекст: атрибуты уже загружены, у многих тип select или multiselect, но значения (options) пустые.

Мне нужно знать:
1. Есть ли API эндпоинт для получения возможных значений атрибута? Параметры (attribute_id, category_code)?
2. Значения привязаны к конкретному атрибуту или к категории?
3. Структура ответа: id/code, name, порядок?
4. Можно ли получить значения для всех атрибутов сразу или только по одному?
5. Есть ли пагинация?

По результатам сформируй pipeline шаги для загрузки значений атрибутов.
ВАЖНО: Создай finding с типом "pipeline" содержащий готовые шаги которые можно запустить.
Используй тип шага "sync_options" для сохранения опций в БД.`,
    inputPlaceholder: 'Добавьте ссылки на документацию API атрибутов/опций...',
    inputHint: 'Дайте ссылки на документацию API опций атрибутов, или опишите как получить данные. Потом нажмите "Начать исследование".',
  },
  {
    id: 'feed',
    label: 'Генерація XML фіду',
    description: 'Створити шаблони для генерації XML фіду маркетплейсу',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'border-green-200 bg-green-50 hover:border-green-400',
    systemContext: `Твоя ЕДИНСТВЕННАЯ задача — создать 4 шаблона XML фида (header, product, variant, footer) для маркетплейса.

НЕ НУЖНО: загружать категории, атрибуты, опции, API-вызовы. Категории и атрибуты УЖЕ загружены.
НУЖНО ТОЛЬКО: 4 шаблона create_template. Больше НИЧЕГО в pipeline. НЕ добавляй generate_feed.

Шаблоны используют Django Template синтаксис ({{ variable }}, {% for %}, {% if %}).

## Доступные переменные:

### header — шапка XML:
- {{ shop_name }}, {{ shop_url }}, {{ company_name }}, {{ time }}
- {{ products_xml }} — XML всех товаров
- {% for category in categories %} — категории: {{ category.id }}, {{ category.code }}, {{ category.name }}

### product — обёртка товара:
Обычно просто: {{ product.variants_xml }}

### variant — ОСНОВНОЙ шаблон, рендерится для каждого variant+size:
Товар: {{ product.name }}, {{ product.name_uk }}, {{ product.code }}, {{ product.url }}
Цены: {{ product.price }}, {{ product.old_price }}, {{ product.promo_price }}
Описание: {{ product.description }}, {{ product.description_uk }}
Категория: {{ product.category.mp_category.code }}, {{ product.category.mp_category.name }}
Бренд: {{ product.brand }}, {{ product.brand_mapped.name }}, {{ product.brand_mapped.external_id }}
Страна: {{ product.country }}, {{ product.country_uk }}, {{ product.country_mapped.name }}, {{ product.country_mapped.external_id }}
Состав: {{ product.composition }}, {{ product.composition_uk }}
Вариант: {{ variant.code }}, {{ variant.color }}, {{ variant.color_uk }}
Цвет маппинг: {{ variant.color_mapped.name }}, {{ variant.color_mapped.external_id }}
Картинки: {% for image in variant.images %}{{ image.url }}{% endfor %}
Размер: {{ size.size }} (ua), {{ size.sku }}, {{ size.stock }}, {{ size.mk_sku }}
Интерпретации: {{ size.interpretations.ua }}, {{ size.interpretations.eu }}, {{ size.interpretations.int }}
Размер маппинг: {{ size.size_mapped.name }}, {{ size.size_mapped.external_id }}

**Атрибуты маркетплейса (ВСЕ уже заполнены через attr-mapping, разбиты по уровням):**
- Product-level: {% for code, attr in product.attrs.items %}
- Variant-level: {% for code, attr in variant.attrs.items %}
- Size-level: {% for code, attr in size.attrs.items %}
Каждый attr: {{ attr.name }}, {{ attr.value }}, {{ attr.value_uk }}, {{ attr.code }}, {{ attr.paramid }}, {{ attr.valueid }}

### footer — закрывающие теги (пустой контекст)

## ФОРМАТ ОТВЕТА:

Создай finding с pipeline из ТОЛЬКО create_template шагов + generate_feed:

\`\`\`json
{"type": "finding", "category": "pipeline", "data": [
  {"type": "create_template", "name": "header", "config": {"template_type": "header", "content": "...XML..."}},
  {"type": "create_template", "name": "product", "config": {"template_type": "product", "content": "{{ product.variants_xml }}"}},
  {"type": "create_template", "name": "variant", "config": {"template_type": "variant", "content": "...XML offer..."}},
  {"type": "create_template", "name": "footer", "config": {"template_type": "footer", "content": ""}}
]}
\`\`\`

ВАЖНО: В variant шаблоне используй ТОЛЬКО переменные из списка выше. НЕ выдумывай свои.`,
    inputPlaceholder: 'Додайте посилання на документацію формату фіду маркетплейсу, приклади XML...',
    inputHint: 'Дайте посилання на документацію формату XML фіду маркетплейсу, приклади, або опишіть вимоги. Натисніть "Почати дослідження".',
  },
];

// =============================================================================
// Main component
// =============================================================================

export default function ResearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const marketplaceId = Number(params.id);
  const queryClient = useQueryClient();

  // Auto-select preset from ?preset= query param
  const presetParam = searchParams.get('preset');
  const initialPreset = presetParam
    ? RESEARCH_PRESETS.find((p) => p.id === presetParam) || null
    : null;

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activePreset, setActivePreset] = useState<ResearchPreset | null>(initialPreset);
  const [conversationPurpose, setConversationPurpose] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prepFileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['research-conversation', conversationId],
    queryFn: () => researchAPI.get(conversationId!),
    enabled: !!conversationId,
    refetchInterval: isPolling ? 2000 : false,
  });

  const { data: conversations } = useQuery({
    queryKey: ['research-conversations', marketplaceId],
    queryFn: () => researchAPI.list(marketplaceId),
    enabled: !!marketplaceId && !conversationId,
  });

  const startMutation = useMutation({
    mutationFn: ({ query, purpose }: { query: string; purpose?: string }) =>
      researchAPI.start(marketplaceId, query),
    onSuccess: (data, variables) => {
      setConversationId(data.conversation_id);
      setConversationPurpose(variables.purpose || null);
      setIsPolling(true);
      setInputValue('');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => researchAPI.send(conversationId!, message),
    onSuccess: () => {
      refetchConversation();
      setInputValue('');
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => researchAPI.apply(conversationId!, conversationPurpose || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', marketplaceId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', marketplaceId] });
      refetchConversation();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, message }: { file: File; message?: string }) =>
      researchAPI.uploadFile(conversationId!, file, message),
    onSuccess: () => {
      refetchConversation();
      setInputValue('');
      setSelectedFile(null);
    },
  });

  useEffect(() => {
    if (conversation) {
      if (conversation.status === 'completed' || conversation.status === 'error') {
        setIsPolling(false);
      } else if (conversation.status === 'active' || conversation.status === 'processing') {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    }
  }, [conversation?.status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFile && conversationId) {
      uploadMutation.mutate({ file: selectedFile, message: inputValue || undefined });
      return;
    }

    if (!inputValue.trim()) return;

    if (conversationId) {
      sendMutation.mutate(inputValue);
    } else {
      startMutation.mutate({ query: inputValue });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectConversation = (id: number) => setConversationId(id);

  const handleNewConversation = () => {
    setConversationId(null);
    setInputValue('');
    setSelectedFile(null);
    setActivePreset(null);
  };

  const handleStartPresetResearch = () => {
    if (!activePreset) return;
    const userInput = inputValue.trim();
    const fullQuery = userInput
      ? `${activePreset.systemContext}\n\nМатериалы от пользователя:\n${userInput}`
      : activePreset.systemContext;
    startMutation.mutate({ query: fullQuery, purpose: activePreset.id });
  };

  const handlePrepFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // =========================================================================
  // Conversation list view (no active conversation)
  // =========================================================================

  if (!conversationId) {
    // Active preset — preparation form
    if (activePreset) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              <h2 className="text-xl font-semibold">AI Research Agent</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setActivePreset(null); setInputValue(''); setSelectedFile(null); }}>
              Назад
            </Button>
          </div>

          <Card className={`border-2 ${activePreset.color.split(' ').slice(0, 2).join(' ')}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {activePreset.icon}
                {activePreset.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activePreset.inputHint}
              </p>

              {/* File attachment */}
              <input
                type="file"
                ref={prepFileInputRef}
                onChange={handlePrepFileSelect}
                className="hidden"
                accept=".xml,.json,.csv,.txt,.html,.md,.yaml,.yml,.pdf,.xlsx,.xls"
              />

              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedFile(null); if (prepFileInputRef.current) prepFileInputRef.current.value = ''; }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* User input */}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activePreset.inputPlaceholder}
                className="w-full h-32 p-3 text-sm border rounded-md resize-none"
                disabled={startMutation.isPending}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => prepFileInputRef.current?.click()}
                  disabled={startMutation.isPending}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Прикрепить файл
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleStartPresetResearch}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Начать исследование
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default — preset selection + free form
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-500" />
            AI Research Agent
          </h2>
        </div>

        {/* Research actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RESEARCH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset)}
              className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer ${preset.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{preset.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {preset.description}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* Free-form research */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Свободный запрос</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Опишите что нужно исследовать..."
                className="flex-1"
                disabled={startMutation.isPending}
              />
              <Button type="submit" disabled={startMutation.isPending || !inputValue.trim()}>
                {startMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Начать
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous conversations */}
        {conversations && conversations.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Предыдущие исследования</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {conv.last_message?.content?.slice(0, 80) || 'Исследование'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        conv.status === 'completed' ? 'default'
                          : conv.status === 'error' ? 'destructive'
                            : 'secondary'
                      }
                      className="shrink-0 ml-2"
                    >
                      {conv.status === 'completed' ? 'Готово'
                        : conv.status === 'error' ? 'Ошибка'
                          : conv.status === 'waiting_input' ? 'Ожидает ответ'
                            : conv.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {conv.messages_count} сообщений •{' '}
                    {new Date(conv.created_at).toLocaleDateString('uk-UA')}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // =========================================================================
  // Chat view (active conversation)
  // =========================================================================

  const hasFindings = conversation?.context && Object.keys(conversation.context).length > 0;
  const pipelineSteps = (conversation?.context?.pipeline_steps ?? []) as Record<string, unknown>[];
  const hasPipelineSteps = pipelineSteps.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-500" />
          <h2 className="text-xl font-semibold">AI Research Agent</h2>
          {conversation && (
            <Badge
              variant={
                conversation.status === 'completed' ? 'default'
                  : conversation.status === 'error' ? 'destructive'
                    : conversation.status === 'waiting_input' ? 'outline'
                      : 'secondary'
              }
            >
              {conversation.status === 'processing' && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {conversation.status === 'completed' ? 'Готово'
                : conversation.status === 'error' ? 'Ошибка'
                  : conversation.status === 'waiting_input' ? 'Ожидает ответ'
                    : conversation.status === 'processing' ? 'Думает...'
                      : conversation.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {hasFindings && conversation?.status !== 'completed' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Применить результаты
              {hasPipelineSteps && ' → Создать пайплайн'}
            </Button>
          )}
          {applyMutation.isSuccess && (
            <Badge variant="default" className="bg-green-600">
              Результаты применены
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleNewConversation}>
            Новое исследование
          </Button>
        </div>
      </div>

      {/* Messages */}
      <Card>
        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto p-4">
          <div className="space-y-4">
            {conversation?.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {(startMutation.isPending || sendMutation.isPending || uploadMutation.isPending || isPolling) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {uploadMutation.isPending ? 'Загрузка файла...' : 'AI думает...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          {selectedFile && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".xml,.json,.csv,.txt,.html,.md,.yaml,.yml,.pdf,.xlsx,.xls"
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMutation.isPending || uploadMutation.isPending || conversation?.status === 'processing'}
              title="Прикрепить файл"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                selectedFile ? 'Комментарий к файлу (опционально)...'
                  : conversation?.status === 'waiting_input' ? 'Ваш ответ...'
                    : 'Напишите сообщение...'
              }
              disabled={sendMutation.isPending || uploadMutation.isPending || conversation?.status === 'processing'}
              autoFocus={conversation?.status === 'waiting_input'}
            />
            <Button
              type="submit"
              disabled={
                sendMutation.isPending || uploadMutation.isPending ||
                (!inputValue.trim() && !selectedFile) ||
                conversation?.status === 'processing'
              }
            >
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          {conversation?.status === 'waiting_input' && (
            <p className="text-xs text-muted-foreground mt-2">
              Агент ожидает ваш ответ. Можно прикрепить файл (XML, JSON, CSV, PDF, XLSX и др.)
            </p>
          )}
        </div>
      </Card>

      {/* Findings / Context */}
      {hasFindings && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Обнаруженные данные
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {conversation.context.api_config != null && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">API конфигурация</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(conversation.context.api_config as Record<string, unknown>, null, 2)}
                </pre>
              </div>
            )}
            {hasPipelineSteps && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Шаги пайплайна ({pipelineSteps.length})
                </div>
                <div className="space-y-1">
                  {pipelineSteps.map((step, i) => {
                    const stepName = String(step.name || step.type || `Step ${i + 1}`);
                    const stepType = step.type ? String(step.type) : null;
                    return (
                      <div key={i} className="text-xs bg-muted p-2 rounded flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center font-medium shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium">{stepName}</span>
                        {stepType && <Badge variant="outline" className="text-xs">{stepType}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {conversation.context.discovered_urls != null && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">URL</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-16">
                  {JSON.stringify(conversation.context.discovered_urls as unknown[], null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// Chat message
// =============================================================================

function ChatMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isSystem ? 'bg-yellow-100' : 'bg-violet-100'
          }`}
        >
          {isSystem ? (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          ) : (
            <Bot className="h-4 w-4 text-violet-600" />
          )}
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser ? 'bg-primary text-primary-foreground'
            : isSystem ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-muted'
        }`}
      >
        {message.message_type === 'question' && (
          <Badge variant="outline" className="mb-2 text-xs">Требуется ответ</Badge>
        )}
        {message.message_type === 'findings' && (
          <Badge variant="default" className="mb-2 text-xs bg-green-600">Найдено</Badge>
        )}
        {message.message_type === 'progress' && (
          <Badge variant="secondary" className="mb-2 text-xs">Прогресс</Badge>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-2 prose-code:bg-black/10 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        <div className="text-xs opacity-60 mt-1">
          {new Date(message.created_at).toLocaleTimeString('uk-UA')}
        </div>
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
