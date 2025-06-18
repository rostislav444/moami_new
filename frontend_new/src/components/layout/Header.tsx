'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CategoryState } from '@/types/categories';
import { SimpleImage } from '@/components/ui/SimpleImage';
import { useCartStore } from '@/store/cart';

interface HeaderProps {
    categories: CategoryState[];
}

export function Header({ categories }: HeaderProps) {
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: 'left' | 'right' }>({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
    const { quantity, toggleCart } = useCartStore();

    const handleMouseEnter = (categoryId: number, event: React.MouseEvent<HTMLDivElement>) => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            setHideTimeout(null);
        }
        
        setHoveredCategory(categoryId);
        
        const rect = event.currentTarget.getBoundingClientRect();
        const dropdownWidth = 320;
        const viewportWidth = window.innerWidth;
        const spaceOnRight = viewportWidth - rect.right;
        
        const position = spaceOnRight < dropdownWidth ? 'right' : 'left';
        
        setDropdownPosition(prev => ({
            ...prev,
            [categoryId]: position
        }));
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredCategory(null);
        }, 150);
        setHideTimeout(timeout);
    };

    const handleDropdownEnter = () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            setHideTimeout(null);
        }
    };

    const handleDropdownLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredCategory(null);
        }, 100);
        setHideTimeout(timeout);
    };

    return (
        <header className="border-b bg-white/90 border-amber-200/50 backdrop-blur-sm fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between">
                    <Link href="/" className="text-4xl font-thin tracking-wide text-amber-900 font-serif" style={{ letterSpacing: '0.05em' }}>
                        Moami
                    </Link>

                    <nav className="flex items-center space-x-12">
                        {categories.map((category) => (
                            <div 
                                key={category.id}
                                className="relative"
                                onMouseEnter={(e) => handleMouseEnter(category.id, e)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <Link 
                                    href={`/catalogue/${category.slug}`}
                                    className="text-base font-light tracking-wide text-amber-900/80 hover:text-amber-900 transition-all duration-500 font-serif"
                                    style={{ letterSpacing: '0.05em' }}
                                >
                                    {category.name}
                                </Link>
                                
                                {hoveredCategory === category.id && category.children.length > 0 && (
                                    <div 
                                        className={`absolute top-full mt-2 bg-white border border-amber-200 shadow-xl min-w-80 ${
                                            dropdownPosition[category.id] === 'right' ? 'right-0' : 'left-0'
                                        }`}
                                        style={{ borderRadius: '8px', zIndex: 99999 }}
                                        onMouseEnter={handleDropdownEnter}
                                        onMouseLeave={handleDropdownLeave}
                                    >
                                        <div className="py-3">
                                            {category.children.slice(0, 8).map((subcategory) => (
                                                <Link
                                                    key={subcategory.id}
                                                    href={`/catalogue/${category.slug}/${subcategory.slug}`}
                                                    className="flex items-center px-4 py-3 hover:bg-amber-50 transition-colors duration-200"
                                                >
                                                    <div className="relative block overflow-hidden flex-shrink-0 mr-3 bg-amber-100" style={{ borderRadius: '6px', width: '48px', height: '48px' }}>
                                                        {subcategory.image ? (
                                                            <SimpleImage
                                                                src={subcategory.image}
                                                                alt={subcategory.name}
                                                                className="absolute top-0 left-0 w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-amber-200 flex items-center justify-center">
                                                                <span className="text-amber-800 text-sm font-light font-serif">
                                                                    {subcategory.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-base font-light text-amber-900 mb-1 font-serif">
                                                            {subcategory.name}
                                                        </h4>
                                                        <p className="text-sm text-amber-700/70 font-light font-serif">
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

                    {/* Desktop Cart */}
                    <button onClick={toggleCart} className="flex items-center text-amber-900/80 hover:text-amber-900 transition-colors duration-300 relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="ml-2 text-base font-light font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>Кошик</span>
                        {quantity > 0 && (
                            <span className="absolute -top-2 -right-2 bg-amber-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                                {quantity}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between">
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-amber-900 p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Mobile Logo */}
                    <Link href="/" className="text-2xl font-thin tracking-wide text-amber-900 font-serif" style={{ letterSpacing: '0.05em' }}>
                        Moami
                    </Link>

                    {/* Mobile Cart */}
                    <button onClick={toggleCart} className="text-amber-900 p-2 relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {quantity > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-light">
                                {quantity}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-amber-200/50">
                        <nav className="flex flex-col space-y-4 pt-4">
                            {categories.map((category) => (
                                <div key={category.id} className="border-b border-amber-100/50 pb-4">
                                    <Link 
                                        href={`/catalogue/${category.slug}`}
                                        className="text-lg font-light text-amber-900 font-serif block mb-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {category.name}
                                    </Link>
                                    {category.children.length > 0 && (
                                        <div className="ml-4 space-y-2">
                                            {category.children.slice(0, 5).map((subcategory) => (
                                                <Link
                                                    key={subcategory.id}
                                                    href={`/catalogue/${category.slug}/${subcategory.slug}`}
                                                    className="text-base font-light text-amber-800/80 font-serif block"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    {subcategory.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
} 