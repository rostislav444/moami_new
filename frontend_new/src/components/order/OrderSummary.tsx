'use client';

import { useCartStore } from '@/store/cart';
import { CartItem } from '@/types/cart';
import Image from 'next/image';

interface OrderItemProps {
  item: CartItem;
}

function OrderItem({ item }: OrderItemProps) {
  return (
    <div className="flex gap-3 py-3 border-b border-amber-100/50 last:border-b-0">
      <div className="relative w-16 h-20 flex-shrink-0 bg-amber-50 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-light text-amber-900 mb-1 line-clamp-2 font-serif">
          {item.name}
        </h4>
        
        <div className="text-xs text-amber-700/60 mb-2 font-light font-serif">
          Розмір: {item.size[item.selectedGrid as keyof typeof item.size]} ({item.selectedGrid})
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-amber-800/70 font-light font-serif">
            {item.quantity} × {item.price} ₴
          </div>
          <div className="text-sm font-medium text-amber-900">
            {item.price * item.quantity} ₴
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderSummary() {
  const { items, total, quantity } = useCartStore();

  return (
    <div className="bg-white p-6 border border-amber-200/100 space-y-6 sticky top-8">
      <h2 className="text-xl font-light text-amber-900 font-serif">
        Товари у замовленні
      </h2>

      {/* Items List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <OrderItem key={item.id} item={item} />
        ))}
      </div>

      {/* Summary */}
      <div className="space-y-3 border-t border-amber-200/50 pt-4">
        <div className="flex justify-between text-amber-800/70">
          <span className="font-light font-serif">Кількість товарів:</span>
          <span className="font-serif">{quantity}</span>
        </div>
        
        <div className="flex justify-between text-amber-800/70">
          <span className="font-light font-serif">Вартість товарів:</span>
          <span className="font-serif">{total} ₴</span>
        </div>
        
        <div className="flex justify-between text-amber-800/70">
          <span className="font-light font-serif">Доставка:</span>
          <span className="font-serif text-xs">Розраховується після оформлення</span>
        </div>
        
        <div className="border-t border-amber-200/50 pt-3">
          <div className="flex justify-between text-lg font-medium text-amber-900">
            <span className="font-serif">До сплати:</span>
            <span className="font-serif">{total} ₴</span>
          </div>
          <p className="text-xs text-amber-700/60 mt-1 font-light font-serif">
            + вартість доставки
          </p>
        </div>
      </div>
    </div>
  );
} 