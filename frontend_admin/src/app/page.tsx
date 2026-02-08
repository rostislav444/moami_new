import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, FolderTree, FileCode, Package } from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    title: 'Маркетплейсы',
    value: '—',
    description: 'Активных интеграций',
    icon: Store,
    href: '/marketplaces',
  },
  {
    title: 'Категории',
    value: '—',
    description: 'Замаппленных категорий',
    icon: FolderTree,
    href: '/categories',
  },
  {
    title: 'Шаблоны фидов',
    value: '—',
    description: 'Настроенных шаблонов',
    icon: FileCode,
    href: '/feed-templates',
  },
  {
    title: 'Товары',
    value: '—',
    description: 'Готовых к экспорту',
    icon: Package,
    href: '/export',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace Admin</h1>
        <p className="text-muted-foreground">
          Управление интеграциями с маркетплейсами и генерацией фидов
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Часто используемые операции</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/categories"
              className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium">Маппинг категорий</div>
              <div className="text-sm text-muted-foreground">
                Связать категории магазина с категориями маркетплейса
              </div>
            </Link>
            <Link
              href="/feed-templates"
              className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium">Редактор шаблонов</div>
              <div className="text-sm text-muted-foreground">
                Настроить XML шаблоны для генерации фидов
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние действия</CardTitle>
            <CardDescription>История синхронизаций</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Нет недавних действий</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
