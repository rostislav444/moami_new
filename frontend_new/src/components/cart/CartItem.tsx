'use client';

import { useCartStore } from '@/store/cart';
import { CartItem as CartItemType } from '@/types/cart';
import Image from 'next/image';
import Link from 'next/link';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateItem, removeItem } = useCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.id);
    } else {
      updateItem(item.id, newQuantity);
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b border-amber-100/50 last:border-b-0">
      {/* Image */}
      <Link href={`/p-${item.slug}`} className="relative w-20 h-24 flex-shrink-0 bg-amber-50 overflow-hidden" style={{ borderRadius: '2px' }}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/p-${item.slug}`} className="block">
          <h3 className="text-sm font-light text-amber-900 mb-1 line-clamp-2 font-serif">
            {item.name}
          </h3>
        </Link>
        
        <div className="text-xs text-amber-700/60 mb-2 font-light font-serif">
          Розмір: {item.size[item.selectedGrid as keyof typeof item.size]} ({item.selectedGrid})
        </div>

        <div className="flex items-center justify-between">
          {/* Price */}
          <div className="space-y-1">
            {item.old_price && (
              <div className="text-xs text-amber-600/60 line-through font-light">
                {item.old_price} ₴
              </div>
            )}
            <div className="text-sm font-medium text-amber-900">
              {item.price} ₴
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-amber-200 rounded" style={{ borderRadius: '2px' }}>
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-amber-800 hover:bg-amber-50 transition-colors duration-200"
              >
                −
              </button>
              <span className="w-10 h-8 flex items-center justify-center text-sm text-amber-900 bg-white">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 flex items-center justify-center text-amber-800 hover:bg-amber-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-amber-700/60 hover:text-amber-800 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-xs text-amber-700/60 mt-1 font-light font-serif">
          Всього: {item.price * item.quantity} ₴
        </div>
      </div>
    </div>
  );
} 