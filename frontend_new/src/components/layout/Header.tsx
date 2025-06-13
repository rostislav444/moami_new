'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCategoriesStore } from '@/store/categories';
import { CategoryState } from '@/types/categories';

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const categories = useCategoriesStore((state) => state.categories);

    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="text-2xl font-bold text-gray-900">
                        Moami
                    </Link>

                    <nav className="hidden md:flex space-x-8">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="relative group"
                                onMouseEnter={() => setActiveCategory(category.id)}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <Link
                                    href={`/${category.slug}`}
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    {category.name}
                                </Link>

                                {category.children.length > 0 && (
                                    <div
                                        className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
                                            activeCategory === category.id ? 'block' : 'hidden'
                                        }`}
                                    >
                                        <div className="py-2">
                                            {category.children.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={`/${category.slug}/${child.slug}`}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                >
                                                    {child.image && (
                                                        <img
                                                            src={child.image}
                                                            alt={child.name}
                                                            className="w-8 h-8 rounded object-cover mr-3"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{child.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {child.products_count} товаров
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200">
                        {categories.map((category) => (
                            <div key={category.id} className="py-2">
                                <Link
                                    href={`/${category.slug}`}
                                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {category.name}
                                </Link>
                                {category.children.length > 0 && (
                                    <div className="ml-4 border-l-2 border-gray-100 pl-4">
                                        {category.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/${category.slug}/${child.slug}`}
                                                className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}; 