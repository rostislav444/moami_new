'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CategoryState } from '@/types/categories';

interface HeaderClientProps {
    categories: CategoryState[];
}

export function HeaderClient({ categories }: HeaderClientProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {isMenuOpen && (
                <div className="absolute top-full left-0 right-0 md:hidden border-t border-gray-200 bg-white z-50">
                    {categories.map((category) => (
                        <div key={category.id} className="py-2">
                            <Link
                                href={`/catalogue/${category.slug}`}
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
                                            href={`/catalogue/${category.slug}/${child.slug}`}
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
        </>
    );
} 