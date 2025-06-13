'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useCategoriesStore, mockCategories } from '@/store/categories';
import { CategoryState } from '@/types/categories';
import Link from 'next/link';

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = params.category as string;
    const { categories, setCategories } = useCategoriesStore();
    const [category, setCategory] = useState<CategoryState | null>(null);

    useEffect(() => {
        if (categories.length === 0) {
            setCategories(mockCategories);
        }
    }, [categories.length, setCategories]);

    useEffect(() => {
        if (categories.length > 0) {
            const foundCategory = categories.find(cat => cat.slug === categorySlug);
            setCategory(foundCategory || null);
        }
    }, [categories, categorySlug]);

    if (!category) {
        return (
            <Layout categories={categories}>
                <div className="text-center py-16">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Категория не найдена</h1>
                    <Link href="/" className="text-blue-600 hover:text-blue-800">
                        Вернуться на главную
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout categories={categories}>
            <div className="py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{category.name}</h1>
                    <p className="text-lg text-gray-600">{category.products_count} товаров в категории</p>
                </div>

                {category.children.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {category.children.map((child) => (
                            <Link
                                key={child.id}
                                href={`/${category.slug}/${child.slug}`}
                                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
                            >
                                <div className="aspect-w-16 aspect-h-9 relative h-48">
                                    {child.image ? (
                                        <img
                                            src={child.image}
                                            alt={child.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                            <span className="text-gray-500 text-lg font-medium">
                                                {child.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                        {child.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {child.products_count} товаров
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
} 