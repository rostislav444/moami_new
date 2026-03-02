/**
 * API клиент для работы с AI Research Agent
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// =============================================================================
// Types
// =============================================================================

export interface AgentMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  message_type: 'text' | 'question' | 'findings' | 'progress' | 'error' | 'action';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentConversation {
  id: number;
  marketplace: number;
  marketplace_name: string;
  status: 'active' | 'waiting_input' | 'processing' | 'completed' | 'error';
  context: Record<string, unknown>;
  messages: AgentMessage[];
  created_at: string;
  updated_at: string;
}

export interface AgentConversationListItem {
  id: number;
  marketplace: number;
  marketplace_name: string;
  status: string;
  messages_count: number;
  last_message: {
    role: string;
    content: string;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface StartResearchResponse {
  conversation_id: number;
  task_id: number;
  status: string;
}

export interface SendMessageResponse {
  messages: AgentMessage[];
  status: string;
  context: Record<string, unknown>;
}

export interface PollResponse {
  status: string;
  messages: AgentMessage[];
  context: Record<string, unknown>;
}

export interface ApplyFindingsResponse {
  success: boolean;
  changes: {
    api_config_updated?: boolean;
    pipeline_created?: boolean;
    pipeline_id?: number;
    steps_count?: number;
  };
}

export interface UploadFileResponse {
  messages: AgentMessage[];
  status: string;
  context: Record<string, unknown>;
  file_name: string;
  file_size: number;
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

export const researchAPI = {
  /**
   * Получить список разговоров
   */
  list: (marketplaceId?: number) => {
    const params = marketplaceId ? `?marketplace=${marketplaceId}` : '';
    return fetchAPI<AgentConversationListItem[]>(`/marketplaces/research/${params}`);
  },

  /**
   * Получить разговор с сообщениями
   */
  get: (conversationId: number) =>
    fetchAPI<AgentConversation>(`/marketplaces/research/${conversationId}/`),

  /**
   * Начать новое исследование
   */
  start: (marketplaceId: number, initialQuery: string) =>
    fetchAPI<StartResearchResponse>('/marketplaces/research/start/', {
      method: 'POST',
      body: JSON.stringify({
        marketplace_id: marketplaceId,
        initial_query: initialQuery,
      }),
    }),

  /**
   * Отправить ответ пользователя
   */
  send: (conversationId: number, message: string) =>
    fetchAPI<SendMessageResponse>(`/marketplaces/research/${conversationId}/send/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /**
   * Polling новых сообщений
   */
  poll: (conversationId: number, since?: string) => {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return fetchAPI<PollResponse>(`/marketplaces/research/${conversationId}/poll/${params}`);
  },

  /**
   * Применить результаты исследования
   */
  apply: (conversationId: number, purpose?: string) =>
    fetchAPI<ApplyFindingsResponse>(`/marketplaces/research/${conversationId}/apply/`, {
      method: 'POST',
      body: JSON.stringify({ purpose: purpose || 'other' }),
    }),

  /**
   * Продолжить исследование в фоне
   */
  continueAsync: (conversationId: number, message: string) =>
    fetchAPI<{ task_id: number; status: string }>(
      `/marketplaces/research/${conversationId}/continue_async/`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    ),

  /**
   * Загрузить файл в чат
   */
  uploadFile: async (conversationId: number, file: File, message?: string): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }

    const response = await fetch(
      `${API_BASE}/marketplaces/research/${conversationId}/upload/`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  },
};
