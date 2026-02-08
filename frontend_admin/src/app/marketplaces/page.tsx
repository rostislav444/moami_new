'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplacesAPI, type Marketplace } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function MarketplacesPage() {
  const queryClient = useQueryClient();

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
              Нет настроенных маркетплейсов. Добавьте маркетплейс через Django Admin.
            </CardContent>
          </Card>
        )}
      </div>
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
