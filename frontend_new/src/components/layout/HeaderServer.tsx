import Link from 'next/link';
import { CategoryState } from '@/types/categories';
import { HeaderClient } from './HeaderClient';
import { SafeImage } from '@/components/ui/SafeImage';

interface HeaderServerProps {
    categories: CategoryState[];
}

export function HeaderServer({ categories }: HeaderServerProps) {
    return (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="text-2xl font-bold text-gray-900">
                        Moami
                    </Link>

                    <nav className="hidden md:flex space-x-8">
                        {categories.map((category) => (
                            <div key={category.id} className="relative group">
                                <Link
                                    href={`/catalogue/${category.slug}`}
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    {category.name}
                                </Link>
                                {category.children.length > 0 && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <div className="py-2">
                                            {category.children.map((child) => (
                                                <Link
                                                    key={child.id}
                                                    href={`/catalogue/${category.slug}/${child.slug}`}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                >
                                                    <SafeImage
                                                        src={child.image || ''}
                                                        alt={child.name}
                                                        className="w-8 h-8 rounded object-cover mr-3"
                                                    />
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

                    <HeaderClient categories={categories} />
                </div>
            </div>
        </header>
    );
} 