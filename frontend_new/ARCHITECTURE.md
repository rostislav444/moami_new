# Архитектура проекта

## Server vs Client Components

### Когда использовать Server Components:
- ✅ Статичный контент (главная страница, категории)
- ✅ SEO-критичные страницы
- ✅ Первичная загрузка данных
- ✅ Кеширование на уровне сервера

### Когда использовать Client Components:
- ✅ Интерактивность (формы, кнопки, модальные окна)
- ✅ Реальное время (поиск, корзина)
- ✅ Обновления без перезагрузки страницы
- ✅ Локальное состояние (useState, useReducer)

## Стратегия данных

### SSR + TanStack Query гибрид:

```typescript
// 1. Server Component получает данные
async function CategoryPage({ params }) {
    const categories = await getCategoriesServer(); // Server-side fetch
    
    return (
        <Layout categories={categories}>
            <CategoriesServer initialCategories={categories} />
        </Layout>
    );
}

// 2. Гидратируем данные в TanStack Query
function CategoriesClient({ initialCategories }) {
    const queryClient = useQueryClient();
    
    useEffect(() => {
        queryClient.setQueryData(['categories'], initialCategories);
    }, []);
    
    return null; // Только для гидратации
}

// 3. Client Components используют хуки
function InteractiveComponent() {
    const { data: categories } = useCategories(); // Из кеша или API
    // интерактивная логика
}
```

## Преимущества текущего подхода:

### 🚀 Производительность:
- **Server Components** рендерятся на сервере → меньше JS на клиенте
- **Кеширование** на уровне сервера и клиента  
- **Первичная загрузка** мгновенная (SSR)

### 🔄 UX:
- **Быстрая навигация** через кеш TanStack Query
- **Автоматическая синхронизация** данных
- **Оптимистичные обновления** для интерактивных элементов

### 🛠 DX:
- **TypeScript** типизация на всех уровнях
- **React Query DevTools** для дебага
- **Автоматическая дедупликация** запросов

## Сравнение подходов

| Подход | SSR | Кеширование | Интерактивность | Bundle Size |
|--------|-----|-------------|-----------------|-------------|
| Только Zustand | ❌ | ⚠️ | ✅ | Маленький |
| Только Server | ✅ | ✅ | ❌ | Минимальный |
| **SSR + TanStack Query** | ✅ | ✅ | ✅ | Оптимальный |

## Структура компонентов

```
components/
├── layout/
│   ├── HeaderServer.tsx      // Server Component
│   ├── HeaderClient.tsx      // Client для мобильного меню
│   └── Layout.tsx           // Server Component
├── home/
│   ├── CategoriesServer.tsx  // Server Component
│   └── CategoriesClient.tsx  // Client для гидратации
└── ui/
    └── LoadingSpinner.tsx   // Client Component
```

## Рекомендации

1. **По умолчанию Server Components** - добавляйте `'use client'` только при необходимости
2. **Минимальные Client Components** - выносите интерактивность в отдельные маленькие компоненты
3. **Гидратация данных** - используйте невидимые Client Components для инициализации TanStack Query
4. **Кеширование** - настройте правильные `staleTime` и `gcTime` для разных типов данных 