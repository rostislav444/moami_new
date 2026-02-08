'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { researchAPI, type AgentMessage, type AgentConversation } from '@/lib/research-api';
import { taskAPI } from '@/lib/task-api';
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
  Play,
  Paperclip,
  X,
} from 'lucide-react';

export default function ResearchPage() {
  const params = useParams();
  const marketplaceId = Number(params.id);
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageTime = useRef<string | null>(null);

  // Fetch conversation if we have an ID
  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['research-conversation', conversationId],
    queryFn: () => researchAPI.get(conversationId!),
    enabled: !!conversationId,
    refetchInterval: isPolling ? 2000 : false,
  });

  // Fetch existing conversations
  const { data: conversations } = useQuery({
    queryKey: ['research-conversations', marketplaceId],
    queryFn: () => researchAPI.list(marketplaceId),
    enabled: !!marketplaceId && !conversationId,
  });

  // Start new research
  const startMutation = useMutation({
    mutationFn: (query: string) => researchAPI.start(marketplaceId, query),
    onSuccess: (data) => {
      setConversationId(data.conversation_id);
      setIsPolling(true);
      setInputValue('');
    },
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: (message: string) => researchAPI.send(conversationId!, message),
    onSuccess: () => {
      refetchConversation();
      setInputValue('');
    },
  });

  // Apply findings
  const applyMutation = useMutation({
    mutationFn: () => researchAPI.apply(conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', marketplaceId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', marketplaceId] });
      refetchConversation();
    },
  });

  // Upload file
  const uploadMutation = useMutation({
    mutationFn: ({ file, message }: { file: File; message?: string }) =>
      researchAPI.uploadFile(conversationId!, file, message),
    onSuccess: () => {
      refetchConversation();
      setInputValue('');
      setSelectedFile(null);
    },
  });

  // Handle polling status
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If file is selected, upload it
    if (selectedFile && conversationId) {
      uploadMutation.mutate({ file: selectedFile, message: inputValue || undefined });
      return;
    }

    if (!inputValue.trim()) return;

    if (conversationId) {
      sendMutation.mutate(inputValue);
    } else {
      startMutation.mutate(inputValue);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectConversation = (id: number) => {
    setConversationId(id);
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setInputValue('');
    setSelectedFile(null);
  };

  // Show conversation list if no active conversation
  if (!conversationId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-500" />
            AI Research Agent
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Начать исследование</CardTitle>
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
            <p className="text-sm text-muted-foreground mt-2">
              Например: &quot;Исследуй как интегрироваться с Rozetka&quot; или &quot;Найди документацию для
              Prom.ua API&quot;
            </p>
          </CardContent>
        </Card>

        {conversations && conversations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Предыдущие исследования</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {conv.last_message?.content || 'Исследование'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        conv.status === 'completed'
                          ? 'default'
                          : conv.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {conv.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
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

  // Show chat interface
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
                conversation.status === 'completed'
                  ? 'default'
                  : conversation.status === 'error'
                    ? 'destructive'
                    : conversation.status === 'waiting_input'
                      ? 'outline'
                      : 'secondary'
              }
            >
              {conversation.status === 'processing' && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              {conversation.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {conversation?.status === 'completed' ||
          (conversation?.status === 'waiting_input' &&
            Object.keys(conversation.context || {}).length > 0) ? (
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
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleNewConversation}>
            Новое исследование
          </Button>
        </div>
      </div>

      {/* Messages */}
      <Card>
        <div
          ref={scrollRef}
          className="max-h-[400px] overflow-y-auto p-4"
        >
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

        {/* Input - always visible */}
        <div className="p-4 border-t bg-background">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".xml,.json,.csv,.txt,.html,.md,.yaml,.yml,.pdf,.xlsx,.xls"
            />

            {/* File upload button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                sendMutation.isPending ||
                uploadMutation.isPending ||
                conversation?.status === 'processing'
              }
              title="Прикрепить файл"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                selectedFile
                  ? 'Комментарий к файлу (опционально)...'
                  : conversation?.status === 'waiting_input'
                    ? 'Ваш ответ...'
                    : 'Напишите сообщение...'
              }
              disabled={
                sendMutation.isPending ||
                uploadMutation.isPending ||
                conversation?.status === 'processing'
              }
              autoFocus={conversation?.status === 'waiting_input'}
            />
            <Button
              type="submit"
              disabled={
                sendMutation.isPending ||
                uploadMutation.isPending ||
                (!inputValue.trim() && !selectedFile) ||
                conversation?.status === 'processing'
              }
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {conversation?.status === 'waiting_input' && (
            <p className="text-xs text-muted-foreground mt-2">
              Агент ожидает ваш ответ. Можно прикрепить файл (XML, JSON, CSV, PDF, XLSX и др.)
            </p>
          )}
        </div>
      </Card>

      {/* Context/Findings */}
      {conversation?.context && Object.keys(conversation.context).length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Обнаруженные данные
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(conversation.context, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-muted'
        }`}
      >
        {message.message_type === 'question' && (
          <Badge variant="outline" className="mb-2 text-xs">
            Требуется ответ
          </Badge>
        )}
        {message.message_type === 'findings' && (
          <Badge variant="default" className="mb-2 text-xs bg-green-600">
            Найдено
          </Badge>
        )}
        {message.message_type === 'progress' && (
          <Badge variant="secondary" className="mb-2 text-xs">
            Прогресс
          </Badge>
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
