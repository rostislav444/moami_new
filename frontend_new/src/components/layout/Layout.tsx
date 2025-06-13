import { Header } from './Header';
import { Footer } from './Footer';
import { CategoryState } from '@/types/categories';

interface LayoutProps {
    children: React.ReactNode;
    categories: CategoryState[];
}

export function Layout({ children, categories }: LayoutProps) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#fefcf7' }}>
            <Header categories={categories} />
            <main className="max-w-7xl mx-auto px-8">
                {children}
            </main>
            <Footer categories={categories} />
        </div>
    );
} 