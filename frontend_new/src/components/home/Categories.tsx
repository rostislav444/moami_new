'use client';

import Link from 'next/link';
import { useCategoriesStore } from '@/store/categories';
import { CategorySkeleton } from '@/components/ui/Loading';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

export const Categories = () => {
    const { categories, isLoading } = useCategoriesStore();

    if (isLoading) {
        return (
            <div className="py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Каталог товаров</h1>
                    <p className="text-lg text-gray-600">Загружаем категории...</p>
                </div>
                <CategorySkeleton />
            </div>
        );
    }

    return (
        <div className="py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Каталог товаров</h1>
                <p className="text-lg text-gray-600">Выберите категорию для просмотра товаров</p>
            </div>

            {categories.map((category) => (
                <section key={category.id} className="mb-16">
                    <div className="mb-8">
                        <Link href={`/catalogue/${category.slug}`}>
                            <h2 className="text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">
                                {category.name}
                            </h2>
                        </Link>
                        <p className="text-gray-600 mt-2">{category.products_count} товаров</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {category.children.map((child) => (
                            <Link
                                key={child.id}
                                href={`/catalogue/${category.slug}/${child.slug}`}
                                className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="aspect-w-16 aspect-h-9 relative h-64">
                                    <ImageWithFallback
                                        src={child.image || ''}
                                        alt={child.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        fallbackContent={
                                            <span className="text-gray-500 text-lg font-medium">
                                                {child.name}
                                            </span>
                                        }
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-white text-xl font-bold mb-1 group-hover:text-gray-200 transition-colors">
                                            {child.name}
                                        </h3>
                                        <p className="text-gray-200 text-sm">
                                            {child.products_count} товаров
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}; 