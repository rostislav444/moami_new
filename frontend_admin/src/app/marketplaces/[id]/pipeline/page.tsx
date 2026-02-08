'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  pipelineAPI,
  STEP_TYPES,
  type Pipeline,
  type PipelineStep,
  type PipelineRun,
} from '@/lib/pipeline-api';
import { taskAPI } from '@/lib/task-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Workflow,
  Play,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Settings2,
  GripVertical,
} from 'lucide-react';

export default function PipelinePage() {
  const params = useParams();
  const marketplaceId = Number(params.id);
  const queryClient = useQueryClient();

  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<PipelineStep | null>(null);
  const [runningPipelineId, setRunningPipelineId] = useState<number | null>(null);

  // Fetch pipelines
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines', marketplaceId],
    queryFn: () => pipelineAPI.list(marketplaceId),
    enabled: !!marketplaceId,
  });

  // Fetch selected pipeline details
  const { data: pipeline, refetch: refetchPipeline } = useQuery({
    queryKey: ['pipeline', selectedPipeline],
    queryFn: () => pipelineAPI.get(selectedPipeline!),
    enabled: !!selectedPipeline,
  });

  // Fetch pipeline runs
  const { data: runsData, refetch: refetchRuns } = useQuery({
    queryKey: ['pipeline-runs', selectedPipeline],
    queryFn: () => pipelineAPI.getRuns(selectedPipeline!),
    enabled: !!selectedPipeline,
    refetchInterval: runningPipelineId === selectedPipeline ? 2000 : false,
  });

  // Create pipeline
  const createPipelineMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      pipelineAPI.create({
        marketplace_id: marketplaceId,
        name: data.name,
        description: data.description,
      }),
    onSuccess: (newPipeline) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', marketplaceId] });
      setSelectedPipeline(newPipeline.id);
      setShowCreateModal(false);
    },
  });

  // Delete pipeline
  const deletePipelineMutation = useMutation({
    mutationFn: (id: number) => pipelineAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', marketplaceId] });
      setSelectedPipeline(null);
    },
  });

  // Run pipeline
  const runPipelineMutation = useMutation({
    mutationFn: (id: number) => pipelineAPI.run(id),
    onSuccess: (result) => {
      setRunningPipelineId(selectedPipeline);
      refetchRuns();
    },
  });

  // Create step
  const createStepMutation = useMutation({
    mutationFn: (data: { step_type: string; name: string; config: Record<string, unknown> }) =>
      pipelineAPI.createStep({
        pipeline: selectedPipeline!,
        order: (pipeline?.steps.length || 0),
        ...data,
      }),
    onSuccess: () => {
      refetchPipeline();
      setShowStepModal(false);
    },
  });

  // Update step
  const updateStepMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<PipelineStep>;
    }) => pipelineAPI.updateStep(id, data),
    onSuccess: () => {
      refetchPipeline();
      setEditingStep(null);
    },
  });

  // Delete step
  const deleteStepMutation = useMutation({
    mutationFn: (id: number) => pipelineAPI.deleteStep(id),
    onSuccess: () => refetchPipeline(),
  });

  // Check for running pipelines
  useEffect(() => {
    if (runsData?.runs.some((r) => r.status === 'running')) {
      setRunningPipelineId(selectedPipeline);
    } else {
      setRunningPipelineId(null);
    }
  }, [runsData, selectedPipeline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Workflow className="h-5 w-5 text-blue-500" />
          Пайплайны синхронизации
        </h2>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать пайплайн
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Pipeline list */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Пайплайны</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {pipelines && pipelines.length > 0 ? (
                  <div className="divide-y">
                    {pipelines.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPipeline(p.id)}
                        className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                          selectedPipeline === p.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.name}</span>
                          {p.last_run_status && (
                            <Badge
                              variant={
                                p.last_run_status === 'completed'
                                  ? 'default'
                                  : p.last_run_status === 'failed'
                                    ? 'destructive'
                                    : p.last_run_status === 'running'
                                      ? 'secondary'
                                      : 'outline'
                              }
                              className="text-xs"
                            >
                              {p.last_run_status === 'running' && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              {p.last_run_status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.steps_count} шагов • {p.runs_count} запусков
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Нет пайплайнов
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline details */}
        <div className="col-span-8">
          {pipeline ? (
            <div className="space-y-4">
              {/* Header */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{pipeline.name}</CardTitle>
                      {pipeline.description && (
                        <CardDescription>{pipeline.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => runPipelineMutation.mutate(pipeline.id)}
                        disabled={runPipelineMutation.isPending || runningPipelineId === pipeline.id}
                      >
                        {runPipelineMutation.isPending || runningPipelineId === pipeline.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Запустить
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => {
                          if (confirm('Удалить пайплайн?')) {
                            deletePipelineMutation.mutate(pipeline.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Steps */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Шаги ({pipeline.steps.length})</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowStepModal(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить шаг
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {pipeline.steps.length > 0 ? (
                    <div className="divide-y">
                      {pipeline.steps.map((step, index) => (
                        <StepRow
                          key={step.id}
                          step={step}
                          index={index}
                          onEdit={() => setEditingStep(step)}
                          onDelete={() => {
                            if (confirm('Удалить шаг?')) {
                              deleteStepMutation.mutate(step.id);
                            }
                          }}
                          onToggle={() =>
                            updateStepMutation.mutate({
                              id: step.id,
                              data: { is_enabled: !step.is_enabled },
                            })
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Добавьте шаги в пайплайн
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Run history */}
              {runsData && runsData.runs.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">История запусков</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[200px]">
                      <div className="divide-y">
                        {runsData.runs.slice(0, 10).map((run) => (
                          <RunRow key={run.id} run={run} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Выберите пайплайн</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create pipeline modal */}
      <CreatePipelineModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(data) => createPipelineMutation.mutate(data)}
        isPending={createPipelineMutation.isPending}
      />

      {/* Create/Edit step modal */}
      <StepModal
        open={showStepModal || !!editingStep}
        onClose={() => {
          setShowStepModal(false);
          setEditingStep(null);
        }}
        step={editingStep}
        onCreate={(data) => createStepMutation.mutate(data)}
        onUpdate={(data) =>
          editingStep && updateStepMutation.mutate({ id: editingStep.id, data })
        }
        isPending={createStepMutation.isPending || updateStepMutation.isPending}
      />
    </div>
  );
}

function StepRow({
  step,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  step: PipelineStep;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const stepType = STEP_TYPES.find((t) => t.value === step.step_type);

  return (
    <div
      className={`flex items-center gap-3 p-3 group ${!step.is_enabled ? 'opacity-50' : ''}`}
    >
      <div className="text-muted-foreground cursor-move">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{step.name}</div>
        <div className="text-xs text-muted-foreground">
          {stepType?.label || step.step_type}
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {step.on_error}
      </Badge>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle}>
          {step.is_enabled ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RunRow({ run }: { run: PipelineRun }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div
        className={`w-2 h-2 rounded-full ${
          run.status === 'completed'
            ? 'bg-green-500'
            : run.status === 'failed'
              ? 'bg-red-500'
              : run.status === 'running'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-gray-300'
        }`}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              run.status === 'completed'
                ? 'default'
                : run.status === 'failed'
                  ? 'destructive'
                  : 'secondary'
            }
            className="text-xs"
          >
            {run.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {run.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {run.completed_steps_count}/{run.total_steps_count} шагов
          </span>
        </div>
        {run.error_message && (
          <div className="text-xs text-red-500 mt-1 truncate">{run.error_message}</div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {run.started_at && new Date(run.started_at).toLocaleString('uk-UA')}
      </div>
      {run.duration !== null && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {run.duration.toFixed(1)}s
        </div>
      )}
    </div>
  );
}

function CreatePipelineModal({
  open,
  onClose,
  onCreate,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать пайплайн</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Синхронизация категорий"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опционально"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StepModal({
  open,
  onClose,
  step,
  onCreate,
  onUpdate,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  step: PipelineStep | null;
  onCreate: (data: { step_type: string; name: string; config: Record<string, unknown> }) => void;
  onUpdate: (data: Partial<PipelineStep>) => void;
  isPending: boolean;
}) {
  const [stepType, setStepType] = useState(step?.step_type || '');
  const [name, setName] = useState(step?.name || '');
  const [configJson, setConfigJson] = useState(
    step?.config ? JSON.stringify(step.config, null, 2) : '{}'
  );

  useEffect(() => {
    if (step) {
      setStepType(step.step_type);
      setName(step.name);
      setConfigJson(JSON.stringify(step.config, null, 2));
    } else {
      setStepType('');
      setName('');
      setConfigJson('{}');
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepType || !name.trim()) return;

    let config = {};
    try {
      config = JSON.parse(configJson);
    } catch {
      alert('Invalid JSON in config');
      return;
    }

    if (step) {
      onUpdate({ step_type: stepType, name: name.trim(), config });
    } else {
      onCreate({ step_type: stepType, name: name.trim(), config });
    }
  };

  const handleClose = () => {
    setStepType('');
    setName('');
    setConfigJson('{}');
    onClose();
  };

  const selectedType = STEP_TYPES.find((t) => t.value === stepType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{step ? 'Редактировать шаг' : 'Добавить шаг'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step_type">Тип шага</Label>
            <Select value={stepType} onValueChange={setStepType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="step_name">Название</Label>
            <Input
              id="step_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedType?.label || 'Название шага'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Конфигурация (JSON)</Label>
            <textarea
              id="config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="w-full h-32 p-2 text-sm font-mono border rounded-md"
              placeholder='{"url": "https://..."}'
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !stepType || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {step ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
