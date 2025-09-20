import { CategoryState } from '@/types/categories';
import { mockCategories } from '@/store/categories';

interface DataSourceProps {
    categories: CategoryState[];
}

export function DataSource({ categories }: DataSourceProps) {
    const isFromAPI = categories.length > 0 && categories !== mockCategories;
    const isMockData = categories === mockCategories || 
        (categories.length > 0 && categories[0].id === mockCategories[0].id);

    return (
        <div className="mb-4 p-3 border">
            <div className="flex items-center gap-2 text-sm">
                {isFromAPI && !isMockData ? (
                    <>
                        <span className="w-2 h-2 bg-green-500"></span>
                        <span className="text-green-700">Данные загружены с API бекенда</span>
                        <span className="text-gray-500">({categories.length} категорий)</span>
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 bg-yellow-500"></span>
                        <span className="text-yellow-700">Используются mock данные</span>
                        <span className="text-gray-500">({categories.length} категорий)</span>
                    </>
                )}
            </div>
        </div>
    );
} 