'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CategoryState } from '@/types/categories';
import { SimpleImage } from '@/components/ui/SimpleImage';

interface MinimalCategoriesGridProps {
    categories: CategoryState[];
}

export function MinimalCategoriesGrid({ categories }: MinimalCategoriesGridProps) {
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: 'left' | 'right' }>({});

    const handleMouseEnter = (categoryId: number, event: React.MouseEvent<HTMLDivElement>) => {
        setHoveredCategory(categoryId);
        
        // Определяем позицию выпадающего меню
        const rect = event.currentTarget.getBoundingClientRect();
        const dropdownWidth = 320; // min-w-80 = 320px
        const viewportWidth = window.innerWidth;
        const spaceOnRight = viewportWidth - rect.right;
        
        // Если места справа недостаточно, прижимаем к правому краю
        const position = spaceOnRight < dropdownWidth ? 'right' : 'left';
        
        setDropdownPosition(prev => ({
            ...prev,
            [categoryId]: position
        }));
    };

    const handleMouseLeave = () => {
        setHoveredCategory(null);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#fefcf7' }}>
            {/* Header */}
            <header className="border-b border-amber-100/50 bg-white/90 backdrop-blur-sm sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-4xl font-thin tracking-wide text-amber-900 font-serif" style={{ letterSpacing: '0.05em' }}>
                            Moami
                        </Link>
                        <nav className="hidden md:flex items-center space-x-16">
                            {categories.map((category) => (
                                <div 
                                    key={category.id}
                                    className="relative"
                                    onMouseEnter={(e) => handleMouseEnter(category.id, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                                                        <Link 
                                        href={`/catalogue/${category.slug}`}
                                        className="text-sm font-light tracking-wide text-amber-800/70 hover:text-amber-900 transition-all duration-500 font-serif"
                                        style={{ letterSpacing: '0.05em' }}
                                    >
                                        {category.name}
                                    </Link>
                                    
                                    {/* Dropdown Menu */}
                                    {hoveredCategory === category.id && category.children.length > 0 && (
                                        <div 
                                            className={`absolute top-full mt-2 bg-white border border-gray-200 shadow-xl min-w-80 z-[9999] ${
                                                dropdownPosition[category.id] === 'right' ? 'right-0' : 'left-0'
                                            }`}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <div className="py-3">
                                                {category.children.slice(0, 8).map((subcategory) => (
                                                    <Link
                                                        key={subcategory.id}
                                                        href={`/catalogue/${category.slug}/${subcategory.slug}`}
                                                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                                                    >
                                                        <div className="relative block overflow-hidden flex-shrink-0 mr-3 bg-gray-100" style={{ borderRadius: '6px', width: '48px', height: '48px' }}>
                                                            {subcategory.image ? (
                                                                <SimpleImage
                                                                    src={subcategory.image}
                                                                    alt={subcategory.name}
                                                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="text-gray-400 text-sm font-medium">
                                                                        {subcategory.name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                                {subcategory.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                {subcategory.products_count} товарів
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-24">

                {/* Subcategories for each main category */}
                {categories.map((category) => (
                    category.children.length > 0 && (
                        <section key={`sub-${category.id}`} className="mb-24">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-thin tracking-wide text-amber-900 mb-4 font-serif" style={{ letterSpacing: '0.06em' }}>
                                    {category.name}
                                </h2>
                                <p className="text-amber-800/50 text-lg font-light font-serif">
                                    {category.products_count} товарів у категорії
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
                                {category.children.map((subcategory, index) => {
                                    // Произвольные размеры с вариацией ширины и высоты (±15% от квадрата)
                                    // Смещаем паттерн для каждой категории чтобы избежать повторения
                                    const patternIndex = (index + category.id * 3) % 8;
                                    let gridClass = '';
                                    let aspectClass = '';
                                    
                                    if (patternIndex === 0) {
                                        gridClass = 'col-span-2 md:col-span-3'; // Широкий блок
                                        aspectClass = 'aspect-[7/6]'; // Немного горизонтальный
                                    } else if (patternIndex === 1) {
                                        gridClass = 'col-span-2 md:col-span-2'; // Обычный блок
                                        aspectClass = 'aspect-[6/7]'; // Немного вертикальный
                                    } else if (patternIndex === 2) {
                                        gridClass = 'col-span-2 md:col-span-2'; // Обычный блок
                                        aspectClass = 'aspect-square'; // Квадрат
                                    } else if (patternIndex === 3) {
                                        gridClass = 'col-span-2 md:col-span-3'; // Широкий блок
                                        aspectClass = 'aspect-square'; // Квадрат
                                    } else if (patternIndex === 4) {
                                        gridClass = 'col-span-2 md:col-span-2'; // Обычный блок
                                        aspectClass = 'aspect-[7/6]'; // Немного горизонтальный
                                    } else if (patternIndex === 5) {
                                        gridClass = 'col-span-2 md:col-span-2'; // Обычный блок
                                        aspectClass = 'aspect-[6/7]'; // Немного вертикальный
                                    } else if (patternIndex === 6) {
                                        gridClass = 'col-span-4 md:col-span-4'; // Очень широкий блок (только на десктопе)
                                        aspectClass = 'aspect-[7/5]'; // Горизонтальный
                                    } else {
                                        gridClass = 'col-span-2 md:col-span-2'; // Обычный блок
                                        aspectClass = 'aspect-square'; // Квадрат
                                    }

                                    return (
                                        <Link
                                            key={subcategory.id}
                                            href={`/catalogue/${category.slug}/${subcategory.slug}`}
                                            className={`group block ${gridClass}`}
                                        >
                                            <div className={`relative ${aspectClass} overflow-hidden bg-gradient-to-br from-amber-50/20 to-amber-100/10 hover:shadow-xl transition-all duration-700 ease-out`} style={{ borderRadius: '2px' }}>
                                                {subcategory.image && (
                                                    <SimpleImage
                                                        src={subcategory.image}
                                                        alt={subcategory.name}
                                                        className="w-full h-full object-cover group-hover:scale-[1.20] transition-transform duration-700 ease-out"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent"></div>
                                                
                                                {/* Category Info Overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                                                    <h4 className="text-lg md:text-xl font-thin tracking-wide text-white mb-1 md:mb-2 font-serif" style={{ letterSpacing: '0.04em' }}>
                                                        {subcategory.name}
                                                    </h4>
                                                    <p className="text-xs md:text-sm font-extralight text-white/80 tracking-wide font-serif" style={{ letterSpacing: '0.1em' }}>
                                                        {subcategory.products_count} товарів
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )
                ))}
            </main>

            {/* Footer Section */}
            <footer className="mt-32 pt-16 border-t border-amber-200/20 bg-white/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-amber-800/40">
                        <div>
                            <h4 className="font-light text-amber-900 mb-6 tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>Послуги</h4>
                            <ul className="space-y-3">
                                <li><Link href="/delivery" className="hover:text-amber-900 transition-colors duration-300 font-serif">Доставка</Link></li>
                                <li><Link href="/returns" className="hover:text-amber-900 transition-colors duration-300 font-serif">Повернення</Link></li>
                                <li><Link href="/size-guide" className="hover:text-amber-900 transition-colors duration-300 font-serif">Розміри</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-light text-amber-900 mb-6 tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>Колекції</h4>
                            <ul className="space-y-3">
                                {categories.slice(0, 3).map((category) => (
                                    <li key={category.id}>
                                        <Link href={`/catalogue/${category.slug}`} className="hover:text-amber-900 transition-colors duration-300 font-serif">
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-light text-amber-900 mb-6 tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>Про нас</h4>
                            <ul className="space-y-3">
                                <li><Link href="/about" className="hover:text-amber-900 transition-colors duration-300 font-serif">Наша історія</Link></li>
                                <li><Link href="/contacts" className="hover:text-amber-900 transition-colors duration-300 font-serif">Контакти</Link></li>
                                <li><Link href="/blog" className="hover:text-amber-900 transition-colors duration-300 font-serif">Блог</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-light text-amber-900 mb-6 tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>Соцмережі</h4>
                            <ul className="space-y-3">
                                <li><Link href="#" className="hover:text-amber-900 transition-colors duration-300 font-serif">Instagram</Link></li>
                                <li><Link href="#" className="hover:text-amber-900 transition-colors duration-300 font-serif">Pinterest</Link></li>
                                <li><Link href="#" className="hover:text-amber-900 transition-colors duration-300 font-serif">Telegram</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-16 pt-12 border-t border-amber-200/20 text-center">
                        <p className="text-amber-700/30 text-sm font-light tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>
                            © 2024 Moami. Всі права захищені.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
} 