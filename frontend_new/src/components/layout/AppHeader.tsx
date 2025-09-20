'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SimpleImage } from '@/components/ui/SimpleImage'
import { useCategories } from '@/hooks/useCategories'

export function AppHeader() {
  const { data: categories = [], isLoading, error } = useCategories()
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: number]: 'left' | 'right' }>({})

  const handleMouseEnter = (categoryId: number, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredCategory(categoryId)
    
    const rect = event.currentTarget.getBoundingClientRect()
    const windowWidth = window.innerWidth
    const dropdownWidth = 320
    const spaceOnRight = windowWidth - rect.right
    
    const position = spaceOnRight < dropdownWidth ? 'right' : 'left'
    setDropdownPosition(prev => ({
      ...prev,
      [categoryId]: position
    }))
  }

  const handleMouseLeave = () => {
    setHoveredCategory(null)
  }
  
  return (
    <header className="border-b border-amber-100/50 bg-white/90 backdrop-blur-sm sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-4xl font-thin tracking-wide text-amber-900 font-serif" style={{ letterSpacing: '0.05em' }}>
            Moami
          </Link>
          
          <nav className="hidden md:flex items-center space-x-16">
            {isLoading && (
              <div className="text-sm text-amber-800/50 font-serif">Завантаження...</div>
            )}
            
            {error && (
              <div className="text-sm text-red-600 font-serif">Помилка завантаження</div>
            )}
            
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
                    style={{}}
                  >
                    <div className="py-3">
                      {category.children.slice(0, 8).map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/catalogue/${category.slug}/${subcategory.slug}`}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="relative block overflow-hidden flex-shrink-0 mr-3 bg-gray-100" style={{ width: '48px', height: '48px' }}>
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
  )
} 