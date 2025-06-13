'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useCategoriesStore, mockCategories } from '@/store/categories';
import { CategoryState } from '@/types/categories';
import Link from 'next/link';

export default function SubcategoryPage() {
    const params = useParams();
    const categorySlug = params.category as string;
    const subcategorySlug = params.subcategory as string;
    const { categories, setCategories } = useCategoriesStore();
    const [category, setCategory] = useState<CategoryState | null>(null);
    const [subcategory, setSubcategory] = useState<CategoryState | null>(null);

    useEffect(() => {
        if (categories.length === 0) {
            setCategories(mockCategories);
        }
    }, [categories.length, setCategories]);

    useEffect(() => {
        if (categories.length > 0) {
            const foundCategory = categories.find(cat => cat.slug === categorySlug);
            setCategory(foundCategory || null);
            
            if (foundCategory) {
                const foundSubcategory = foundCategory.children.find(sub => sub.slug === subcategorySlug);
                setSubcategory(foundSubcategory || null);
            }
        }
    }, [categories, categorySlug, subcategorySlug]);

    if (!category || !subcategory) {
        return (
            <Layout categories={categories}>
                <div className="text-center py-16">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Подкатегория не найдена</h1>
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
                <nav className="flex mb-8" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <Link href="/" className="text-gray-700 hover:text-gray-900">
                                Главная
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <Link href={`/${categorySlug}`} className="text-gray-700 hover:text-gray-900 ml-1 md:ml-2">
                                    {category.name}
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-500 ml-1 md:ml-2">{subcategory.name}</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{subcategory.name}</h1>
                    <p className="text-lg text-gray-600">{subcategory.products_count} товаров</p>
                </div>

                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Товары скоро появятся</h2>
                        <p className="text-gray-600 mb-6">
                            Мы работаем над наполнением каталога. Следите за обновлениями!
                        </p>
                        <Link 
                            href="/" 
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                        >
                            Вернуться к категориям
                        </Link>
                    </div>

                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-gray-50 rounded-lg h-64 animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
} 