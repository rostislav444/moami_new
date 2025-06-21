'use client';

import { useEffect } from 'react';
import { useViewedProductsStore } from '@/store/viewed-products';
import { event as fbEvent } from '@/lib/FacebookPixel';

interface ProductVariant {
  id: number;
  name: string;
  slug: string;
  code: string;
  product: {
    price: number;
    old_price?: number;
  };
  color: {
    id: number;
    name: string;
    code: string;
  };
  images: Array<{
    image: string;
  }>;
}

interface ProductViewTrackerProps {
  variant: ProductVariant;
}

const trackVariantView = async (variantId: number) => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');

  const params = new URLSearchParams({
    variant_id: variantId.toString(),
  });

  if (utmSource) {
    params.append('utm_source', utmSource);
  }

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/product/variants/views/?${params}`, {
    method: 'GET',
  });
};

export function ProductViewTracker({ variant }: ProductViewTrackerProps) {
  const { addViewedProduct } = useViewedProductsStore();

  useEffect(() => {
    const viewedProduct = {
      id: variant.id,
      name: variant.name,
      slug: variant.slug,
      price: variant.product.price,
      old_price: variant.product.old_price,
      image: variant.images[0]?.image || '',
      color: variant.color,
    };

    addViewedProduct(viewedProduct);
    trackVariantView(variant.id);

    // Facebook Pixel ViewContent event - избегаем дублирования
    const timeout = setTimeout(() => {
      fbEvent('ViewContent', {
        content_name: variant.name,
        content_ids: [variant.code],
        content_type: 'product',
        value: variant.product.price,
        currency: 'UAH'
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [variant, addViewedProduct]);

  return null;
} 