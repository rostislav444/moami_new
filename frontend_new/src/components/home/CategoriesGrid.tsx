'use client';

import Link from 'next/link';
import { CategoryState } from '@/types/categories';
import { SimpleImage } from '@/components/ui/SimpleImage';

interface CategoriesGridProps {
    categories: CategoryState[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
    return (
        <div className="py-24">
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
                                const patternIndex = (index + category.id * 3) % 8;
                                let gridClass = '';
                                let aspectClass = '';
                                
                                if (patternIndex === 0) {
                                    gridClass = 'col-span-2 md:col-span-3';
                                    aspectClass = 'aspect-[7/6]';
                                } else if (patternIndex === 1) {
                                    gridClass = 'col-span-2 md:col-span-2';
                                    aspectClass = 'aspect-[6/7]';
                                } else if (patternIndex === 2) {
                                    gridClass = 'col-span-2 md:col-span-2';
                                    aspectClass = 'aspect-square';
                                } else if (patternIndex === 3) {
                                    gridClass = 'col-span-2 md:col-span-3';
                                    aspectClass = 'aspect-square';
                                } else if (patternIndex === 4) {
                                    gridClass = 'col-span-2 md:col-span-2';
                                    aspectClass = 'aspect-[7/6]';
                                } else if (patternIndex === 5) {
                                    gridClass = 'col-span-2 md:col-span-2';
                                    aspectClass = 'aspect-[6/7]';
                                } else if (patternIndex === 6) {
                                    gridClass = 'col-span-4 md:col-span-4';
                                    aspectClass = 'aspect-[7/5]';
                                } else {
                                    gridClass = 'col-span-2 md:col-span-2';
                                    aspectClass = 'aspect-square';
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
        </div>
    );
} 