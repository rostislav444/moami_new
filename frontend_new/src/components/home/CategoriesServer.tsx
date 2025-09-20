import Link from 'next/link';
import { CategoryState } from '@/types/categories';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { SimpleImage } from '@/components/ui/SimpleImage';
import { DataSource } from '@/components/ui/DataSource';

interface CategoriesServerProps {
    initialCategories: CategoryState[];
}

export function CategoriesServer({ initialCategories }: CategoriesServerProps) {
    return (
        <div className="py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Каталог товаров</h1>
                <p className="text-lg text-gray-600">Выберите категорию для просмотра товаров</p>
            </div>

            <DataSource categories={initialCategories} />

            {initialCategories.map((category) => (
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
                                    {child.image ? (
                                        <SimpleImage
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

                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/60 to-transparent">
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
} 