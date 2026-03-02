/**
 * API клиент для работы с Pipeline System
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// =============================================================================
// Types
// =============================================================================

export interface PipelineStep {
  id: number;
  pipeline: number;
  order: number;
  step_type: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  on_error: 'stop' | 'skip' | 'retry';
  retry_count: number;
  timeout: number;
}

export interface Pipeline {
  id: number;
  marketplace: number;
  marketplace_name: string;
  name: string;
  description: string;
  purpose: 'categories' | 'attributes' | 'attribute_options' | 'other';
  is_active: boolean;
  config: Record<string, unknown>;
  steps: PipelineStep[];
  steps_count: number;
  last_run: {
    id: number;
    status: string;
    started_at: string | null;
    finished_at: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineListItem {
  id: number;
  marketplace: number;
  marketplace_name: string;
  name: string;
  description: string;
  purpose: 'categories' | 'attributes' | 'attribute_options' | 'other';
  is_active: boolean;
  steps_count: number;
  runs_count: number;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineRun {
  id: number;
  pipeline: number;
  pipeline_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  finished_at: string | null;
  current_step: number | null;
  current_step_name: string | null;
  progress: Record<
    string,
    {
      status: string;
      result?: Record<string, unknown>;
      error?: string;
      duration?: number;
    }
  >;
  progress_percent: number;
  completed_steps_count: number;
  total_steps_count: number;
  duration: number | null;
  error_message: string;
  created_at: string;
}

export interface CreatePipelineData {
  marketplace_id: number;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  steps?: Array<{
    step_type: string;
    name: string;
    description?: string;
    config?: Record<string, unknown>;
    is_enabled?: boolean;
    on_error?: 'stop' | 'skip' | 'retry';
  }>;
}

export interface CreateStepData {
  pipeline: number;
  order?: number;
  step_type: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  is_enabled?: boolean;
  on_error?: 'stop' | 'skip' | 'retry';
  timeout?: number;
}

// Step type options for UI
export const STEP_TYPES = [
  { value: 'download_file', label: 'Download File', description: 'Скачать файл по URL' },
  { value: 'parse_xml', label: 'Parse XML', description: 'Парсить XML файл' },
  { value: 'parse_json', label: 'Parse JSON', description: 'Парсить JSON файл' },
  { value: 'parse_csv', label: 'Parse CSV', description: 'Парсить CSV файл' },
  { value: 'sync_categories', label: 'Sync Categories', description: 'Синхронизировать категории' },
  { value: 'sync_attributes', label: 'Sync Attributes', description: 'Синхронизировать атрибуты' },
  { value: 'sync_options', label: 'Sync Options', description: 'Синхронизировать опции атрибутов' },
  { value: 'sync_entities', label: 'Sync Entities', description: 'Синхронизировать сущности (бренды, цвета)' },
  { value: 'api_call', label: 'API Call', description: 'Вызвать API эндпоинт' },
  { value: 'transform_data', label: 'Transform Data', description: 'Трансформировать данные' },
  { value: 'ai_process', label: 'AI Processing', description: 'Обработка с помощью AI' },
] as const;

// =============================================================================
// API Functions
// =============================================================================

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

export const pipelineAPI = {
  // ==========================================================================
  // Pipelines
  // ==========================================================================

  /**
   * Получить список пайплайнов
   */
  list: (marketplaceId?: number) => {
    const params = marketplaceId ? `?marketplace=${marketplaceId}` : '';
    return fetchAPI<PipelineListItem[]>(`/marketplaces/pipelines/${params}`);
  },

  /**
   * Получить пайплайн с шагами
   */
  get: (pipelineId: number) => fetchAPI<Pipeline>(`/marketplaces/pipelines/${pipelineId}/`),

  /**
   * Создать пайплайн
   */
  create: (data: CreatePipelineData) =>
    fetchAPI<Pipeline>('/marketplaces/pipelines/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Обновить пайплайн
   */
  update: (pipelineId: number, data: Partial<Pipeline>) =>
    fetchAPI<Pipeline>(`/marketplaces/pipelines/${pipelineId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Удалить пайплайн
   */
  delete: (pipelineId: number) =>
    fetchAPI<void>(`/marketplaces/pipelines/${pipelineId}/`, { method: 'DELETE' }),

  /**
   * Запустить пайплайн
   */
  run: (pipelineId: number, runInBackground = true) =>
    fetchAPI<{ run_id: number; task_id?: number; status: string }>(
      `/marketplaces/pipelines/${pipelineId}/run/`,
      {
        method: 'POST',
        body: JSON.stringify({ run_in_background: runInBackground }),
      }
    ),

  /**
   * Запустить один шаг (тест-режим)
   */
  runStep: (pipelineId: number, stepId: number) =>
    fetchAPI<{
      run_id: number;
      step_id: number;
      step_name: string;
      success: boolean;
      progress: Record<string, { status: string; result?: Record<string, unknown>; error?: string }>;
    }>(`/marketplaces/pipelines/${pipelineId}/run-step/`, {
      method: 'POST',
      body: JSON.stringify({ step_id: stepId }),
    }),

  /**
   * Получить историю запусков
   */
  getRuns: (pipelineId: number) =>
    fetchAPI<{ pipeline_id: number; runs: PipelineRun[] }>(
      `/marketplaces/pipelines/${pipelineId}/runs/`
    ),

  // ==========================================================================
  // Steps
  // ==========================================================================

  /**
   * Получить шаги пайплайна
   */
  getSteps: (pipelineId: number) =>
    fetchAPI<PipelineStep[]>(`/marketplaces/pipeline-steps/?pipeline=${pipelineId}`),

  /**
   * Создать шаг
   */
  createStep: (data: CreateStepData) =>
    fetchAPI<PipelineStep>('/marketplaces/pipeline-steps/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Обновить шаг
   */
  updateStep: (stepId: number, data: Partial<PipelineStep>) =>
    fetchAPI<PipelineStep>(`/marketplaces/pipeline-steps/${stepId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Удалить шаг
   */
  deleteStep: (stepId: number) =>
    fetchAPI<void>(`/marketplaces/pipeline-steps/${stepId}/`, { method: 'DELETE' }),

  /**
   * Переупорядочить шаги
   */
  reorderSteps: (stepIds: number[]) =>
    fetchAPI<{ success: boolean; order: number[] }>('/marketplaces/pipeline-steps/reorder/', {
      method: 'POST',
      body: JSON.stringify({ step_ids: stepIds }),
    }),

  // ==========================================================================
  // Runs
  // ==========================================================================

  /**
   * Получить статус запуска
   */
  getRun: (runId: number) => fetchAPI<PipelineRun>(`/marketplaces/pipeline-runs/${runId}/`),

  /**
   * Отменить запуск
   */
  cancelRun: (runId: number) =>
    fetchAPI<{ success: boolean; status: string }>(`/marketplaces/pipeline-runs/${runId}/cancel/`, {
      method: 'POST',
    }),
};
