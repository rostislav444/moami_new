'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCartStore } from '@/store/cart';
import { useRouter } from 'next/navigation';
import { OrderFormData, OrderRequest } from '@/types/order';

export function OrderForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrderFormData>();
  
  const { items, clearCart } = useCartStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'newpost' | 'address'>('newpost');

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    
    const orderData: OrderRequest = {
      ...data,
      delivery: {
        delivery_type: deliveryType,
        comment: data.delivery.comment,
        [deliveryType]: data.delivery[deliveryType],
      },
      items: items.map(item => ({
        size: item.sizeId,
        quantity: item.quantity,
      })),
    };

    console.log(orderData);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.status === 201) {
        // Сохраняем данные заказа для Facebook Pixel
        const orderData = {
          items: items.map(item => ({
            content_id: item.code,
            content_name: item.name,
            quantity: item.quantity,
            value: item.price
          })),
          total_value: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          currency: 'UAH'
        };
        localStorage.setItem('completedOrder', JSON.stringify(orderData));
        
        // Сначала редирект, потом очистка корзины
        router.push('/order/success');
        setTimeout(() => {
          clearCart();
        }, 100);
      } else {
        console.log(response);
        console.error('Ошибка создания заказа');
      }
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

      return (
      <div className="rounded-sm bg-white p-6 border border-amber-200/100" >
      <h2 className="text-xl font-light text-amber-900 mb-6 font-serif">
        Особисті дані
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Ім'я *"
              className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                errors.first_name 
                  ? 'border-red-400 focus:ring-red-300' 
                  : 'border-amber-200 focus:ring-amber-300'
              } bg-white focus:outline-none focus:ring-2`}
              style={{ borderRadius: '2px' }}
              {...register('first_name', { required: 'Введіть ім\'я' })}
            />
            {errors.first_name && (
              <p className="text-red-600 text-xs mt-1 font-light">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Прізвище *"
              className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                errors.last_name 
                  ? 'border-red-400 focus:ring-red-300' 
                  : 'border-amber-200 focus:ring-amber-300'
              } bg-white focus:outline-none focus:ring-2`}
              style={{ borderRadius: '2px' }}
              {...register('last_name', { required: 'Введіть прізвище' })}
            />
            {errors.last_name && (
              <p className="text-red-600 text-xs mt-1 font-light">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="По батькові"
            className="w-full px-4 py-3 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-light font-serif placeholder-amber-800/60 text-amber-900"
            style={{ borderRadius: '2px' }}
            {...register('father_name')}
          />
        </div>

        <div>
          <input
            type="tel"
            placeholder="Номер телефону *"
            className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
              errors.phone 
                ? 'border-red-400 focus:ring-red-300' 
                : 'border-amber-200 focus:ring-amber-300'
            } bg-white focus:outline-none focus:ring-2`}
            style={{ borderRadius: '2px' }}
            {...register('phone', { required: 'Введіть номер телефону' })}
          />
          {errors.phone && (
            <p className="text-red-600 text-xs mt-1 font-light">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <input
            type="email"
            placeholder="E-mail"
            className="w-full px-4 py-3 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-light font-serif placeholder-amber-800/60 text-amber-900"
            style={{ borderRadius: '2px' }}
            {...register('email', {
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Введіть коректний email'
              }
            })}
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1 font-light">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Delivery Section */}
        <div className="border-t border-amber-200/50 pt-6 mt-6">
          <h3 className="text-lg font-light text-amber-900 mb-4 font-serif">
            Доставка
          </h3>

          {/* Delivery Type Selection */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="newpost"
                checked={deliveryType === 'newpost'}
                onChange={(e) => setDeliveryType(e.target.value as 'newpost')}
                className="mr-3 text-amber-800 focus:ring-amber-300"
              />
              <span className="font-light font-serif text-amber-900">
                Нова Пошта (відділення)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                value="address"
                checked={deliveryType === 'address'}
                onChange={(e) => setDeliveryType(e.target.value as 'address')}
                className="mr-3 text-amber-800 focus:ring-amber-300"
              />
              <span className="font-light font-serif text-amber-900">
                Доставка за адресою
              </span>
            </label>
          </div>

          {/* Delivery Fields */}
          {deliveryType === 'newpost' && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Місто *"
                  className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                    errors.delivery?.newpost?.city
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-amber-200 focus:ring-amber-300'
                  } bg-white focus:outline-none focus:ring-2`}
                  style={{ borderRadius: '2px' }}
                  {...register('delivery.newpost.city', { required: 'Введіть місто' })}
                />
                {errors.delivery?.newpost?.city && (
                  <p className="text-red-600 text-xs mt-1 font-light">
                    {errors.delivery.newpost.city.message}
                  </p>
                )}
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Відділення Нової Пошти *"
                  className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                    errors.delivery?.newpost?.warehouse
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-amber-200 focus:ring-amber-300'
                  } bg-white focus:outline-none focus:ring-2`}
                  style={{ borderRadius: '2px' }}
                  {...register('delivery.newpost.warehouse', { required: 'Введіть відділення' })}
                />
                {errors.delivery?.newpost?.warehouse && (
                  <p className="text-red-600 text-xs mt-1 font-light">
                    {errors.delivery.newpost.warehouse.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {deliveryType === 'address' && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Місто *"
                  className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                    errors.delivery?.address?.city
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-amber-200 focus:ring-amber-300'
                  } bg-white focus:outline-none focus:ring-2`}
                  style={{ borderRadius: '2px' }}
                  {...register('delivery.address.city', { required: 'Введіть місто' })}
                />
                {errors.delivery?.address?.city && (
                  <p className="text-red-600 text-xs mt-1 font-light">
                    {errors.delivery.address.city.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Вулиця *"
                  className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                    errors.delivery?.address?.street
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-amber-200 focus:ring-amber-300'
                  } bg-white focus:outline-none focus:ring-2`}
                  style={{ borderRadius: '2px' }}
                  {...register('delivery.address.street', { required: 'Введіть вулицю' })}
                />
                {errors.delivery?.address?.street && (
                  <p className="text-red-600 text-xs mt-1 font-light">
                    {errors.delivery.address.street.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Будинок *"
                    className={`w-full px-4 py-3 border rounded font-light font-serif placeholder-amber-800/60 text-amber-900 ${
                      errors.delivery?.address?.house
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-amber-200 focus:ring-amber-300'
                    } bg-white focus:outline-none focus:ring-2`}
                    style={{ borderRadius: '2px' }}
                    {...register('delivery.address.house', { required: 'Введіть номер будинку' })}
                  />
                  {errors.delivery?.address?.house && (
                    <p className="text-red-600 text-xs mt-1 font-light">
                      {errors.delivery.address.house.message}
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Квартира"
                  className="w-full px-4 py-3 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-light font-serif placeholder-amber-800/60 text-amber-900"
                  style={{ borderRadius: '2px' }}
                  {...register('delivery.address.apartment')}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <textarea
              placeholder="Коментар до доставки"
              rows={3}
              className="w-full px-4 py-3 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-light font-serif resize-none placeholder-amber-800/60 text-amber-900"
              style={{ borderRadius: '2px' }}
              {...register('delivery.comment')}
            />
          </div>
        </div>

        {/* Order Comment */}
        <div>
          <textarea
            placeholder="Коментар до замовлення"
            rows={3}
            className="w-full px-4 py-3 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-light font-serif resize-none placeholder-amber-800/60 text-amber-900"
            style={{ borderRadius: '2px' }}
            {...register('comment')}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-900 text-white py-4 px-6 font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: '2px' }}
        >
          {isSubmitting ? 'ОФОРМЛЕННЯ...' : 'ПІДТВЕРДИТИ ЗАМОВЛЕННЯ'}
        </button>
      </form>
    </div>
  );
} 