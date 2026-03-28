'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  pipelineAPI,
  type PipelineListItem,
  type Pipeline,
  type PipelineStep,
} from '@/lib/pipeline-api';
import { marketplacesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  FolderTree,
  ListChecks,
  Bot,
  Settings2,
  FlaskConical,
  Eye,
  EyeOff,
  Tags,
} from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// Main page
// =============================================================================

export default function PipelinePage() {
  const params = useParams();
  const marketplaceId = Number(params.id);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['marketplace-stats', marketplaceId],
    queryFn: () => marketplacesAPI.stats(marketplaceId),
    enabled: !!marketplaceId,
  });

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines', marketplaceId],
    queryFn: () => pipelineAPI.list(marketplaceId),
    enabled: !!marketplaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pipelineAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', marketplaceId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Classify by `purpose` field from backend
  const categoryPipelines = pipelines?.filter((p) => p.purpose === 'categories') || [];
  const attributePipelines = pipelines?.filter((p) => p.purpose === 'attributes') || [];
  const optionsPipelines = pipelines?.filter((p) => p.purpose === 'attribute_options') || [];
  const feedPipelines = pipelines?.filter((p) => p.purpose === 'feed') || [];
  const otherPipelines = pipelines?.filter((p) => p.purpose === 'other') || [];

  return (
    <div className="space-y-6">
      {/* Section 1: Categories */}
      <WorkflowSection
        title="Загрузка категорий"
        description="Загрузить дерево категорий маркетплейса"
        icon={<FolderTree className="h-5 w-5 text-blue-500" />}
        stats={
          stats
            ? {
                loaded: stats.categories_count,
                label: 'категорій загружено',
                extra:
                  stats.mapped_categories > 0
                    ? `${stats.mapped_categories} замаплено`
                    : undefined,
              }
            : undefined
        }
        pipelines={categoryPipelines}
        marketplaceId={marketplaceId}
        researchPreset="categories"
        onDelete={(id) => {
          if (confirm('Удалить пайплайн?')) deleteMutation.mutate(id);
        }}
      />

      {/* Section 2: Attributes */}
      <WorkflowSection
        title="Загрузка атрибутів"
        description="Загрузити атрибути (характеристики) для категорій"
        icon={<ListChecks className="h-5 w-5 text-purple-500" />}
        stats={
          stats
            ? {
                loaded: stats.attribute_sets_count,
                label: 'наборів атрибутів',
              }
            : undefined
        }
        pipelines={attributePipelines}
        marketplaceId={marketplaceId}
        researchPreset="attributes"
        onDelete={(id) => {
          if (confirm('Удалити пайплайн?')) deleteMutation.mutate(id);
        }}
      />

      {/* Section 3: Attribute Options */}
      <WorkflowSection
        title="Загрузка значень атрибутів"
        description="Завантажити значення (опції) для select/multiselect атрибутів"
        icon={<Tags className="h-5 w-5 text-orange-500" />}
        stats={
          stats
            ? {
                loaded: stats.attribute_options_count ?? 0,
                label: 'значень завантажено',
              }
            : undefined
        }
        pipelines={optionsPipelines}
        marketplaceId={marketplaceId}
        researchPreset="attribute_options"
        onDelete={(id) => {
          if (confirm('Удалити пайплайн?')) deleteMutation.mutate(id);
        }}
      />

      {/* Section 4: Feed Generation */}
      <WorkflowSection
        title="Генерація фіду"
        description="Згенерувати XML фід для маркетплейсу"
        icon={<Settings2 className="h-5 w-5 text-green-500" />}
        pipelines={feedPipelines}
        marketplaceId={marketplaceId}
        researchPreset="feed"
        onDelete={(id) => {
          if (confirm('Удалити пайплайн?')) deleteMutation.mutate(id);
        }}
      />

      {/* Other pipelines (if any) */}
      {otherPipelines.length > 0 && (
        <WorkflowSection
          title="Інші пайплайни"
          description="Пайплайни не прив'язані до конкретного типу"
          icon={<Settings2 className="h-5 w-5 text-gray-500" />}
          pipelines={otherPipelines}
          marketplaceId={marketplaceId}
          onDelete={(id) => {
            if (confirm('Удалити пайплайн?')) deleteMutation.mutate(id);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Workflow section (categories / attributes)
// =============================================================================

function WorkflowSection({
  title,
  description,
  icon,
  stats,
  pipelines,
  marketplaceId,
  researchPreset,
  onDelete,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  stats?: { loaded: number; label: string; extra?: string };
  pipelines: PipelineListItem[];
  marketplaceId: number;
  researchPreset?: string;
  onDelete: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="text-right">
                <div className="text-lg font-bold">{stats.loaded.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{stats.label}</div>
                {stats.extra && (
                  <div className="text-xs text-green-600">{stats.extra}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pipelines.length > 0 ? (
          pipelines.map((p) => (
            <PipelineCard key={p.id} pipeline={p} onDelete={() => onDelete(p.id)} />
          ))
        ) : (
          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
            <div className="text-sm text-muted-foreground">
              {stats && stats.loaded > 0
                ? 'Данные загружены (пайплайн не сохранён)'
                : 'Нет пайплайна. Запустите исследование чтобы AI создал его.'}
            </div>
            {researchPreset && (
              <Link href={`/marketplaces/${marketplaceId}/research?preset=${researchPreset}`}>
                <Button size="sm" variant="outline">
                  <Bot className="h-4 w-4 mr-2" />
                  Исследовать
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Pipeline card with inline run + test mode
// =============================================================================

function PipelineCard({
  pipeline: pipelineListItem,
  onDelete,
}: {
  pipeline: PipelineListItem;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testingStepId, setTestingStepId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  // Fetch full pipeline details when expanded
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', pipelineListItem.id],
    queryFn: () => pipelineAPI.get(pipelineListItem.id),
    enabled: expanded,
  });

  // Fetch runs
  const { data: runsData } = useQuery({
    queryKey: ['pipeline-runs', pipelineListItem.id],
    queryFn: () => pipelineAPI.getRuns(pipelineListItem.id),
    enabled: expanded,
    refetchInterval: isRunning ? 2000 : false,
  });

  // Check running status
  useEffect(() => {
    if (runsData?.runs.some((r) => r.status === 'running')) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [runsData]);

  const runMutation = useMutation({
    mutationFn: () => pipelineAPI.run(pipelineListItem.id),
    onSuccess: () => {
      setIsRunning(true);
      setExpanded(true);
      queryClient.invalidateQueries({ queryKey: ['pipeline-runs', pipelineListItem.id] });
    },
  });

  const testStepMutation = useMutation({
    mutationFn: (stepId: number) => pipelineAPI.runStep(pipelineListItem.id, stepId),
    onSuccess: (data) => {
      setTestResult(data.progress);
      setTestingStepId(null);
      queryClient.invalidateQueries({ queryKey: ['pipeline-runs', pipelineListItem.id] });
    },
    onError: () => {
      setTestingStepId(null);
    },
  });

  const lastRun = runsData?.runs[0];

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{pipelineListItem.name}</span>
            <Badge variant="outline" className="text-xs">
              {pipelineListItem.steps_count} шагов
            </Badge>
            {pipelineListItem.last_run_status && (
              <RunStatusBadge status={pipelineListItem.last_run_status} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => runMutation.mutate()}
            disabled={
              runMutation.isPending || isRunning || pipelineListItem.steps_count === 0
            }
          >
            {runMutation.isPending || isRunning ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {isRunning ? 'Работает...' : 'Запустить все'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 h-8 w-8 p-0"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded: steps + runs */}
      {expanded && pipeline && (
        <div className="border-t px-3 pb-3">
          {/* Steps */}
          <div className="mt-2 space-y-1">
            {pipeline.steps.map((step, i) => {
              const stepProgress =
                testResult?.[String(step.id)] as
                  | { status: string; result?: Record<string, unknown>; error?: string }
                  | undefined ??
                lastRun?.progress?.[String(step.id)];
              const isTesting = testingStepId === step.id;

              return (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  progress={stepProgress}
                  isTesting={isTesting}
                  isRunning={isRunning}
                  onTest={() => {
                    setTestingStepId(step.id);
                    setTestResult(null);
                    testStepMutation.mutate(step.id);
                  }}
                />
              );
            })}
          </div>

          {/* Last run info */}
          {lastRun && (
            <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <span>Последний запуск:</span>
              <RunStatusBadge status={lastRun.status} />
              {lastRun.started_at && (
                <span>
                  {new Date(lastRun.started_at).toLocaleString('uk-UA')}
                </span>
              )}
              {lastRun.duration != null && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {lastRun.duration.toFixed(1)}s
                </span>
              )}
              {lastRun.error_message && (
                <span className="text-red-500 truncate">
                  {lastRun.error_message}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step row with expandable result
// =============================================================================

interface StepProgress {
  status: string;
  result?: Record<string, unknown>;
  error?: string;
}

function StepRow({
  step,
  index,
  progress,
  isTesting,
  isRunning,
  onTest,
}: {
  step: PipelineStep;
  index: number;
  progress?: StepProgress;
  isTesting: boolean;
  isRunning: boolean;
  onTest: () => void;
}) {
  const [showData, setShowData] = useState(false);

  // Separate simple values from complex ones
  const simpleEntries: [string, string | number | boolean][] = [];
  const complexEntries: [string, unknown][] = [];

  if (progress?.result) {
    for (const [k, v] of Object.entries(progress.result)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        simpleEntries.push([k, v]);
      } else {
        complexEntries.push([k, v]);
      }
    }
  }

  return (
    <div className="rounded hover:bg-muted/50 group">
      {/* Step header line */}
      <div className="flex items-center gap-2 text-sm py-1.5 px-2">
        <StepStatusIcon
          status={isTesting ? 'running' : progress?.status}
          index={index}
        />
        <span className={!step.is_enabled ? 'opacity-50' : ''}>
          {step.name}
        </span>
        <Badge variant="outline" className="text-xs">
          {step.step_type}
        </Badge>

        {/* Simple result values inline */}
        {simpleEntries.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {simpleEntries.map(([k, v]) => (
              <span key={k} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {formatResultKey(k)}: <strong>{String(v)}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Show data toggle if there's complex data */}
        {complexEntries.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setShowData(!showData)}
          >
            {showData ? (
              <EyeOff className="h-3 w-3 mr-1" />
            ) : (
              <Eye className="h-3 w-3 mr-1" />
            )}
            {showData ? 'Скрыть' : 'Данные'}
          </Button>
        )}

        {/* Test button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 ml-auto"
          disabled={isTesting || isRunning}
          onClick={onTest}
        >
          {isTesting ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <FlaskConical className="h-3 w-3 mr-1" />
          )}
          Тест
        </Button>

        {/* Error */}
        {progress?.error && (
          <span className="text-xs text-red-500 truncate max-w-64">
            {progress.error}
          </span>
        )}
      </div>

      {/* Expanded data view */}
      {showData && complexEntries.length > 0 && (
        <div className="px-2 pb-2 space-y-2">
          {complexEntries.map(([k, v]) => (
            <div key={k} className="ml-6">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {formatResultKey(k)}
                {Array.isArray(v) && (
                  <span className="text-muted-foreground/60 ml-1">
                    ({(v as unknown[]).length} элементов)
                  </span>
                )}
              </div>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(v, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function StepStatusIcon({
  status,
  index,
}: {
  status?: string;
  index: number;
}) {
  if (status === 'completed')
    return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
  if (status === 'failed')
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  if (status === 'running')
    return <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />;
  return (
    <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
      {index + 1}
    </span>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }
  > = {
    completed: { variant: 'default', label: 'OK' },
    failed: { variant: 'destructive', label: 'Ошибка' },
    running: { variant: 'secondary', label: 'Работает' },
    pending: { variant: 'outline', label: 'Ожидание' },
    cancelled: { variant: 'outline', label: 'Отменён' },
  };
  const c = map[status] || { variant: 'outline' as const, label: status };
  return (
    <Badge variant={c.variant} className="text-xs">
      {status === 'running' && (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      )}
      {c.label}
    </Badge>
  );
}

function formatResultKey(key: string): string {
  const map: Record<string, string> = {
    synced: 'синхр.',
    created: 'создано',
    updated: 'обновлено',
    source: 'источник',
    entity_type: 'тип',
    items_count: 'элементов',
  };
  return map[key] || key;
}
