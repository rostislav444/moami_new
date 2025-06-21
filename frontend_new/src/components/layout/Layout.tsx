import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryState } from '@/types/categories';
import { PageListItem } from '@/types/pages';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ViewedProducts } from '@/components/viewed-products/ViewedProducts';

interface LayoutProps {
    children: React.ReactNode;
    categories: CategoryState[];
    pages?: PageListItem[];
}

export function Layout({ children, categories, pages = [] }: LayoutProps) {
    return (
        <div className="min-h-screen pt-12 md:pt-24" style={{ backgroundColor: '#f5efe6' }}>
            <Header categories={categories} />
            <main className="max-w-7xl mx-auto px-8">
                {children}
            </main>
            <ViewedProducts />
            <Footer categories={categories} pages={pages} />
            <CartDrawer />
        </div>
    );
} 