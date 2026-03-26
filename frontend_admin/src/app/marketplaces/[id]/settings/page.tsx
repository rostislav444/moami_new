'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { marketplacesAPI, exportAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Download,
  Copy,
  Check,
  FileJson,
  FolderTree,
  GitCompare,
  Tags,
  Layers,
  Package,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

type ExportType = 'full' | 'categories' | 'attributeMappings' | 'entityMappings' | 'attributeSets' | 'products';

const EXPORT_OPTIONS: { key: ExportType; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'full', label: 'Полный экспорт', icon: FileJson, description: 'Все настройки, маппинги и конфигурации' },
  { key: 'categories', label: 'Маппинг категорий', icon: FolderTree, description: 'Связи наших категорий с маркетплейсом' },
  { key: 'attributeMappings', label: 'Маппинг атрибутов', icon: GitCompare, description: 'Связи наших атрибутов с маркетплейсом' },
  { key: 'entityMappings', label: 'Маппинг сущностей', icon: Tags, description: 'Бренды, цвета, страны, размеры' },
  { key: 'attributeSets', label: 'Наборы атрибутов', icon: Layers, description: 'Атрибуты и опции маркетплейса' },
  { key: 'products', label: 'Конфигурации товаров', icon: Package, description: 'Настройки экспорта товаров' },
];

export default function SettingsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [exportType, setExportType] = useState<ExportType | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

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

  const handleExport = async (type: ExportType) => {
    setExporting(true);
    setExportType(type);
    try {
      const data = await exportAPI[type](id);
      setExportData(data);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportData || !exportType) return;
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${marketplace.slug}-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!exportData) return;
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* API Config */}
      <Card>
        <CardHeader>
          <CardTitle>Конфигурация API</CardTitle>
          <CardDescription>
            Настройки подключения к API маркетплейса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-[300px]">
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

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Экспорт конфигурации
          </CardTitle>
          <CardDescription>
            Выгрузить настройки и маппинги в формате JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export buttons grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXPORT_OPTIONS.map(option => {
              const Icon = option.icon;
              const isActive = exportType === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => handleExport(option.key)}
                  disabled={exporting}
                  className={`flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-colors ${
                    isActive
                      ? 'border-blue-300 bg-blue-50'
                      : 'hover:bg-muted/50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              );
            })}
          </div>

          {/* Preview & Actions */}
          {exportData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {exportType && EXPORT_OPTIONS.find(o => o.key === exportType)?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {JSON.stringify(exportData).length.toLocaleString()} bytes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showPreview ? 'Скрыть' : 'Показать'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Скачать JSON
                  </Button>
                </div>
              </div>

              {showPreview && (
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[500px] border">
                  {JSON.stringify(exportData, null, 2)}
                </pre>
              )}
            </div>
          )}

          {exporting && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Генерация экспорта...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
