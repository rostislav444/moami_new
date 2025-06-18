export interface OrderFormData {
  first_name: string;
  last_name: string;
  father_name?: string;
  phone: string;
  email?: string;
  comment?: string;
  delivery: DeliveryData;
}

export interface DeliveryData {
  delivery_type: 'newpost' | 'address';
  comment?: string;
  newpost?: NewPostData;
  address?: AddressData;
}

export interface NewPostData {
  city: string;
  warehouse: string;
}

export interface AddressData {
  city: string;
  street: string;
  house: string;
  apartment?: string;
}

export interface OrderItem {
  size: number;
  quantity: number;
}

export interface OrderRequest {
  first_name: string;
  last_name: string;
  father_name?: string;
  phone: string;
  email?: string;
  comment?: string;
  delivery: DeliveryData;
  items: OrderItem[];
} 