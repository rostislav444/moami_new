import { ReactNode } from 'react';
import { HeaderServer } from './HeaderServer';
import { CategoryState } from '@/types/categories';
import { mockCategories } from '@/store/categories';

interface LayoutProps {
    children: ReactNode;
    categories?: CategoryState[];
}

export const Layout = ({ children, categories = mockCategories }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderServer categories={categories} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <footer className="bg-gray-800 text-white py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p>&copy; 2024 Moami. Все права защищены.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}; 