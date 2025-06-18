import Link from 'next/link';
import { CategoryState } from '@/types/categories';
import { PageListItem } from '@/types/pages';

interface FooterProps {
    categories: CategoryState[];
    pages?: PageListItem[];
}

export function Footer({ categories, pages = [] }: FooterProps) {
    return (
        <footer className="mt-32 pt-16 border-t border-amber-200/20 bg-white/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-amber-800/40">
                    <div>
                        <h4 className="font-light text-amber-900 mb-6 tracking-wide font-serif" style={{ letterSpacing: '0.05em' }}>Інформація</h4>
                        <ul className="space-y-3">
                            {pages.length > 0 ? (
                                pages.slice(0, 4).map((page) => (
                                    <li key={page.slug}>
                                        <Link href={`/info/${page.slug}`} className="hover:text-amber-900 transition-colors duration-300 font-serif">
                                            {page.name}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="/info/delivery" className="hover:text-amber-900 transition-colors duration-300 font-serif">Доставка</Link></li>
                                    <li><Link href="/info/payment" className="hover:text-amber-900 transition-colors duration-300 font-serif">Оплата</Link></li>
                                    <li><Link href="/info/public-offer" className="hover:text-amber-900 transition-colors duration-300 font-serif">Публічна оферта</Link></li>
                                    <li><Link href="/info/returns" className="hover:text-amber-900 transition-colors duration-300 font-serif">Повернення</Link></li>
                                </>
                            )}
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
    );
} 