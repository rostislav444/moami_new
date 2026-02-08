'use client';

import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { marketplacesAPI, categoriesAPI, attributesAPI } from '@/lib/api';
import Link from 'next/link';
import { ChevronRight, RefreshCw, FolderTree, ArrowLeftRight, Layers, Settings2, Link as LinkIcon, Bot, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '', label: 'Категории', icon: FolderTree },
  { href: '/mappings', label: 'Маппинг', icon: ArrowLeftRight },
  { href: '/attributes', label: 'Атрибуты', icon: Layers },
  { href: '/research', label: 'Исследование', icon: Bot },
  { href: '/pipeline', label: 'Пайплайны', icon: Workflow },
  { href: '/settings', label: 'Настройки', icon: Settings2 },
];

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = Number(params.id);

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ['marketplace', id],
    queryFn: () => marketplacesAPI.get(id),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['marketplace-categories', id],
    queryFn: () => categoriesAPI.listMarketplace(id),
    enabled: !!id,
  });

  const { data: attributeSets } = useQuery({
    queryKey: ['attribute-sets', id],
    queryFn: () => attributesAPI.listSets(id),
    enabled: !!id,
  });

  const { data: mappings } = useQuery({
    queryKey: ['category-mappings', id],
    queryFn: () => categoriesAPI.listMappings({ marketplace: id }),
    enabled: !!id,
  });

  if (isLoading || !marketplace) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const basePath = `/marketplaces/${id}`;

  // Determine active tab
  const getActiveTab = () => {
    if (pathname === basePath) return '';
    const suffix = pathname.replace(basePath, '');
    return suffix;
  };
  const activeTab = getActiveTab();

  // Stats
  const totalCategories = categories?.length || 0;
  const totalMappings = mappings?.length || 0;
  const totalAttributeSets = attributeSets?.length || 0;
  const totalAttributes = attributeSets?.reduce((sum, s) => sum + s.attributes_count, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/marketplaces" className="hover:underline">Маркетплейсы</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{marketplace.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{marketplace.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={marketplace.is_active ? 'default' : 'secondary'}>
                {marketplace.is_active ? 'Активен' : 'Неактивен'}
              </Badge>
              <Badge variant="outline">
                {marketplace.integration_type === 'xml_feed' && 'XML фид'}
                {marketplace.integration_type === 'api' && 'API'}
                {marketplace.integration_type === 'both' && 'API + XML'}
              </Badge>
            </div>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-3">
            <StatBadge
              icon={<FolderTree className="h-3.5 w-3.5" />}
              value={totalCategories}
              label="категорій"
              color="amber"
            />
            <StatBadge
              icon={<LinkIcon className="h-3.5 w-3.5" />}
              value={totalMappings}
              label="зв'язків"
              color="green"
            />
            <StatBadge
              icon={<Layers className="h-3.5 w-3.5" />}
              value={totalAttributeSets}
              label="наборів"
              color="violet"
            />
            <StatBadge
              icon={<Layers className="h-3.5 w-3.5" />}
              value={totalAttributes}
              label="атрибутів"
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="border-b">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'amber' | 'green' | 'violet' | 'blue';
}) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClasses[color]}`}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
