# Миграция на Next.js 14 + Zustand + Chakra UI

## Установка зависимостей

Удалите старые зависимости и установите новые:

```bash
# Удалить старые пакеты
yarn remove @reduxjs/toolkit react-redux next-redux-wrapper @emotion/core

# Установить новые зависимости
yarn add @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion
yarn add @tanstack/react-query zustand
yarn add @types/js-cookie

# Обновить существующие
yarn add next@14.0.4 react@^18.2.0 react-dom@^18.2.0
```

## Основные изменения

### 1. State Management
- **Было**: Redux Toolkit
- **Стало**: Zustand
- **Файлы**: `/src/store/index.ts`

### 2. UI Framework
- **Было**: Emotion + кастомные стили
- **Стало**: Chakra UI
- **Файлы**: `/src/theme/index.ts`

### 3. Data Fetching
- **Было**: RTK Query
- **Стало**: TanStack Query (React Query)
- **Файлы**: `/src/lib/api.ts`, `/src/hooks/useApi.ts`

### 4. Next.js App
- **Было**: Next.js 13
- **Стало**: Next.js 14
- **Файлы**: `/src/pages/_app.tsx`

## Пример использования

### Zustand Store
```typescript
import { useStore } from '@/store'

function Component() {
  const { cart, addToCart, removeFromCart } = useStore()
  
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock
    })
  }
}
```

### Chakra UI
```typescript
import { Box, Button, Text } from '@chakra-ui/react'

function Component() {
  return (
    <Box p={4}>
      <Text fontSize="lg" fontWeight="bold">
        Заголовок
      </Text>
      <Button colorScheme="primary">
        Кнопка
      </Button>
    </Box>
  )
}
```

### API Hooks
```typescript
import { useProducts } from '@/hooks/useApi'

function ProductList() {
  const { data: products, isLoading } = useProducts({ category: 'clothing' })
  
  if (isLoading) return <div>Загрузка...</div>
  
  return (
    <div>
      {products?.data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Миграция существующих компонентов

1. Замените Redux hooks на Zustand
2. Замените styled components на Chakra UI
3. Замените RTK Query на TanStack Query hooks
4. Обновите импорты

## Преимущества новой архитектуры

- **Меньше boilerplate** с Zustand
- **Готовые компоненты** с Chakra UI
- **Лучшая производительность** с TanStack Query
- **Современный Next.js 14** с улучшениями
- **TypeScript-first** подход

## Следующие шаги

1. Установите зависимости
2. Запустите `yarn dev` для проверки
3. Постепенно мигрируйте компоненты
4. Протестируйте функциональность 