'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplacesAPI, type Marketplace } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Settings, ExternalLink, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function MarketplacesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: marketplaces, isLoading } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: marketplacesAPI.list,
  });

  const syncMutation = useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'categories' | 'attributes' | 'all' }) =>
      marketplacesAPI.sync(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: marketplacesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaces'] });
      setShowCreate(false);
    },
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Маркетплейсы</h1>
          <p className="text-muted-foreground">
            Управление интеграциями с маркетплейсами
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать маркетплейс
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketplaces?.map((marketplace) => (
          <MarketplaceCard
            key={marketplace.id}
            marketplace={marketplace}
            onSync={(type) => syncMutation.mutate({ id: marketplace.id, type })}
            isSyncing={syncMutation.isPending}
          />
        ))}

        {(!marketplaces || marketplaces.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              Нет настроенных маркетплейсов
            </CardContent>
          </Card>
        )}
      </div>

      <CreateMarketplaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </div>
  );
}

function MarketplaceCard({
  marketplace,
  onSync,
  isSyncing,
}: {
  marketplace: Marketplace;
  onSync: (type: 'categories' | 'attributes' | 'all') => void;
  isSyncing: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{marketplace.name}</CardTitle>
          <Badge variant={marketplace.is_active ? 'default' : 'secondary'}>
            {marketplace.is_active ? 'Активен' : 'Неактивен'}
          </Badge>
        </div>
        <CardDescription>
          {marketplace.integration_type === 'xml_feed' && 'XML фид'}
          {marketplace.integration_type === 'api' && 'API интеграция'}
          {marketplace.integration_type === 'both' && 'API + XML фид'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Последняя синхронизация:</span>
            <span>
              {marketplace.last_sync
                ? new Date(marketplace.last_sync).toLocaleString('ru')
                : 'Никогда'}
            </span>
          </div>
          {marketplace.feed_url && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL фида:</span>
              <a
                href={marketplace.feed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-500 hover:underline"
              >
                Открыть <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync('categories')}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Синхронизировать
          </Button>
          <Link href={`/marketplaces/${marketplace.id}`}>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Настройки
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateMarketplaceModal({
  open,
  onClose,
  onCreate,
  isPending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Parameters<typeof marketplacesAPI.create>[0]) => void;
  isPending: boolean;
  error?: string;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [integrationType, setIntegrationType] = useState<'xml_feed' | 'api' | 'both'>('api');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<'bearer' | 'api_key'>('bearer');
  const [token, setToken] = useState('');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const apiConfig: Record<string, unknown> = {};
    if (baseUrl.trim()) {
      apiConfig.base_url = baseUrl.trim();
      apiConfig.auth_type = authType;
      if (token.trim()) {
        apiConfig.token = token.trim();
      }
    }

    onCreate({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      integration_type: integrationType,
      is_active: true,
      api_config: Object.keys(apiConfig).length > 0 ? apiConfig : undefined,
    });
  };

  const handleClose = () => {
    setName('');
    setSlug('');
    setSlugManual(false);
    setIntegrationType('api');
    setBaseUrl('');
    setAuthType('bearer');
    setToken('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать маркетплейс</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mp-name">Название *</Label>
              <Input
                id="mp-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Epicentr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-slug">Slug</Label>
              <Input
                id="mp-slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="epicentr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Тип интеграции</Label>
            <div className="flex gap-2">
              {(['api', 'xml_feed', 'both'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIntegrationType(type)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    integrationType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {type === 'api' ? 'API' : type === 'xml_feed' ? 'XML Feed' : 'API + XML'}
                </button>
              ))}
            </div>
          </div>

          {(integrationType === 'api' || integrationType === 'both') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mp-url">API Base URL</Label>
                <Input
                  id="mp-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Авторизация</Label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as 'bearer' | 'api_key')}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mp-token">Токен</Label>
                  <Input
                    id="mp-token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Токен доступа"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
