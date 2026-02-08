'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { marketplacesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ['marketplace', id],
    queryFn: () => marketplacesAPI.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!marketplace) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Маркетплейс не найден</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Конфигурация API</CardTitle>
          <CardDescription>
            Настройки подключения к API маркетплейса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(marketplace.api_config, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {marketplace.feed_url && (
        <Card>
          <CardHeader>
            <CardTitle>XML Фид</CardTitle>
            <CardDescription>
              Настройки генерации XML фида
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">URL фида:</p>
              <a
                href={marketplace.feed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {marketplace.feed_url}
              </a>
            </div>
            {marketplace.last_feed_generated && (
              <div>
                <p className="text-sm text-muted-foreground">Последняя генерация:</p>
                <p>{new Date(marketplace.last_feed_generated).toLocaleString('uk-UA')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {marketplace.last_sync && (
        <Card>
          <CardHeader>
            <CardTitle>Синхронизация</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">Последняя синхронизация:</p>
              <p>{new Date(marketplace.last_sync).toLocaleString('uk-UA')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
