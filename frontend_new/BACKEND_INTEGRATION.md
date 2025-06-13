# Интеграция с бекендом

## Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# API URL для подключения к бекенду
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000

# Язык по умолчанию
NEXT_PUBLIC_DEFAULT_LOCALE=uk
```

## API Структура

### Базовые эндпоинты:
- **Категории**: `GET /api/category/categories/`
- **Коллекции**: `GET /api/category/collections/`
- **Конкретная категория**: `GET /api/category/categories/{id}/`
- **Конкретная коллекция**: `GET /api/category/collections/{id}/`

### Структура ответа API

#### Категория:
```json
{
  "id": 1,
  "name": "Платья",
  "slug": "dresses",
  "parent": null,
  "image": "/media/categories/dress.jpg",
  "products_count": 45,
  "preferred_size_grid": "standard",
  "size_group": {
    "id": 1,
    "name": "Стандартные размеры",
    "grids": [
      {
        "id": 1,
        "name": "Женские размеры",
        "slug": "women-sizes"
      }
    ]
  },
  "children": [
    {
      "id": 11,
      "name": "Летние платья",
      "slug": "summer-dresses",
      "parent": 1,
      "image": "/media/categories/summer-dress.jpg",
      "products_count": 15,
      "preferred_size_grid": null,
      "size_group": null,
      "children": []
    }
  ]
}
```

## Архитектура данных

### SSR + TanStack Query гибрид:

1. **Server Components** получают данные на сервере
2. **Гидратация** в TanStack Query для клиентской интерактивности
3. **Fallback** на mock данные при недоступности API

### Обработка ошибок:

```typescript
// Server Action
export async function getCategoriesServer(): Promise<CategoryState[]> {
    try {
        const response = await fetch(`${API_URL}/api/category/categories/`);
        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return []; // Fallback на пустой массив
        }
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return []; // Graceful fallback
    }
}
```

## Кеширование

### Server-side (Next.js):
```typescript
const response = await fetch(url, {
    next: { revalidate: 3600 }, // 1 час
});
```

### Client-side (TanStack Query):
```typescript
useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000,   // 10 минут
});
```

## Локализация

API поддерживает мультиязычность через заголовок:
```typescript
headers: {
    'Accept-Language': 'uk', // uk, ru, en
}
```

## Проверка интеграции

1. Запустите бекенд на `http://localhost:8000`
2. Убедитесь что API доступен: `curl http://localhost:8000/api/category/categories/`
3. Запустите фронтенд: `npm run dev`
4. Проверьте в DevTools что данные загружаются с API

## Fallback режим

Если API недоступен, приложение автоматически использует mock данные:
- Категории отображаются корректно
- Навигация работает
- Пользователь видит placeholder данные 