import Link from 'next/link';
import { SimpleImage } from '@/components/ui/SimpleImage';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    image: string;
    category: string;
}

const mockProducts: Product[] = [
    {
        id: 1,
        name: "Ажурний светр",
        slug: "azhurnyi-svetr",
        price: "5200 ₴",
        image: "https://moami.com.ua/media/categories/category/27/verkhniaia-odezhda.jpg",
        category: "Верхній одяг"
    },
    {
        id: 2,
        name: "Класичний джемпер",
        slug: "klasychnyi-dzhemper",
        price: "4800 ₴",
        image: "https://moami.com.ua/media/categories/category/28/zhenskii-odezhda.jpg",
        category: "Жіночий одяг"
    },
    {
        id: 3,
        name: "Елегантна сумка",
        slug: "elegantna-sumka",
        price: "3200 ₴",
        image: "https://moami.com.ua/media/categories/category/29/aksessuari.jpg",
        category: "Аксесуари"
    },
    {
        id: 4,
        name: "Шкіряні черевики",
        slug: "shkiriani-cherevyky",
        price: "6800 ₴",
        image: "https://moami.com.ua/media/categories/category/30/vzuttia.jpg",
        category: "Взуття"
    }
];

export function ProductShowcase() {
    return (
        <section className="py-32" style={{ backgroundColor: '#fefcf7' }}>
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-24">
                    <h2 className="text-5xl font-thin tracking-wide text-amber-900 mb-8 font-serif" style={{ letterSpacing: '0.06em' }}>
                        Новинки
                    </h2>
                    <p className="text-amber-800/50 max-w-3xl mx-auto text-lg font-light leading-relaxed font-serif" style={{ letterSpacing: '0.02em' }}>
                        Відкрийте для себе останні творіння нашого українського ательє
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    {mockProducts.map((product) => (
                        <Link 
                            key={product.id}
                            href={`/p-${product.slug}`}
                            className="group block"
                        >
                            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50/20 to-amber-100/10 mb-8 hover:shadow-2xl transition-all duration-1000 ease-out" style={{ borderRadius: '1px' }}>
                                <SimpleImage
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1200 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-800"></div>
                                
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-sm">
                                        <span className="text-xs font-light text-amber-900 font-serif tracking-wide">
                                            Новинка
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-xs font-extralight text-amber-700/40 tracking-widest uppercase mb-2 font-serif" style={{ letterSpacing: '0.12em' }}>
                                    {product.category}
                                </p>
                                <h3 className="text-xl font-thin tracking-wide text-amber-900 mb-3 font-serif" style={{ letterSpacing: '0.03em' }}>
                                    {product.name}
                                </h3>
                                <p className="text-lg font-light text-amber-800 font-serif">
                                    {product.price}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-20">
                    <Link 
                        href="/"
                        className="inline-block px-12 py-4 border border-amber-800/30 text-amber-900 hover:bg-amber-50/50 transition-all duration-500 font-serif font-light tracking-wide"
                        style={{ letterSpacing: '0.05em', borderRadius: '1px' }}
                    >
                        Переглянути всю колекцію
                    </Link>
                </div>
            </div>
        </section>
    );
} 