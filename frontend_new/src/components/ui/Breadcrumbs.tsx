import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="py-4 pb-8 text-sm">
            <ol className="flex items-center space-x-2 text-amber-800/60">
                <li>
                    <Link 
                        href="/" 
                        className="hover:text-amber-900 transition-colors duration-300 font-serif"
                    >
                        Головна
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                        <span className="text-amber-800/40">/</span>
                        {item.href ? (
                            <Link 
                                href={item.href}
                                className="hover:text-amber-900 transition-colors duration-300 font-serif"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-amber-900 font-serif">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
} 