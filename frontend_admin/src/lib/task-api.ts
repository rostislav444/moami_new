/**
 * API клиент для работы с Background Tasks
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// =============================================================================
// Types
// =============================================================================

export interface BackgroundTask {
  id: number;
  task_type: 'pipeline_run' | 'research_agent' | 'sync_operation' | 'file_download' | 'ai_processing';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string;
  progress: number;
  progress_message: string;
  duration: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  content_type: number | null;
  content_type_name: string | null;
  object_id: number | null;
}

export interface BackgroundTaskListItem {
  id: number;
  task_type: string;
  name: string;
  status: string;
  progress: number;
  progress_message: string;
  duration: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface TaskPollResponse {
  id: number;
  status: string;
  progress: number;
  progress_message: string;
  result: Record<string, unknown> | null;
  error: string | null;
}

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

export const taskAPI = {
  /**
   * Получить список задач
   */
  list: (params?: { type?: string; status?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return fetchAPI<BackgroundTaskListItem[]>(`/marketplaces/tasks/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить детали задачи
   */
  get: (taskId: number) => fetchAPI<BackgroundTask>(`/marketplaces/tasks/${taskId}/`),

  /**
   * Polling статуса задачи
   */
  poll: (taskId: number) => fetchAPI<TaskPollResponse>(`/marketplaces/tasks/${taskId}/poll/`),

  /**
   * Отменить задачу
   */
  cancel: (taskId: number) =>
    fetchAPI<{ success: boolean; status: string }>(`/marketplaces/tasks/${taskId}/cancel/`, {
      method: 'POST',
    }),

  /**
   * Получить активные задачи
   */
  getActive: () =>
    fetchAPI<{ count: number; tasks: BackgroundTaskListItem[] }>('/marketplaces/tasks/active/'),
};

// =============================================================================
// Polling Hook Helper
// =============================================================================

export interface UseTaskPollingOptions {
  taskId: number | null;
  interval?: number;
  enabled?: boolean;
  onComplete?: (task: TaskPollResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Создать интервал для polling задачи
 * Использование:
 *
 * const { start, stop, isPolling } = createTaskPolling({
 *   taskId,
 *   interval: 2000,
 *   onComplete: (task) => { ... },
 *   onError: (err) => { ... },
 * });
 */
export function createTaskPolling(options: UseTaskPollingOptions) {
  let intervalId: NodeJS.Timeout | null = null;
  let isPolling = false;

  const poll = async () => {
    if (!options.taskId) return;

    try {
      const task = await taskAPI.poll(options.taskId);

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        stop();
        options.onComplete?.(task);
      }
    } catch (error) {
      options.onError?.(error as Error);
    }
  };

  const start = () => {
    if (isPolling || !options.taskId) return;
    isPolling = true;
    poll(); // Poll immediately
    intervalId = setInterval(poll, options.interval || 2000);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isPolling = false;
  };

  return { start, stop, isPolling: () => isPolling };
}
