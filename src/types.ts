export interface Customer {
  id: string;
  code: string;
  name: string;
  afm: string;
  address: string;
  city: string;
}

export interface Product {
  code: string;
  description: string;
  price: number;
  brand: string;
  imageUrl?: string;
  quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderRecord {
  id: string;
  date: string;
  customerName: string;
  customerCode: string;
  customerAfm: string;
  items: CartItem[];
  totalValue: number;
  notes?: string;
}

export interface Brand {
  name: string;
  imageUrl?: string;
  is_hidden?: boolean;
}

export type UserRole = 'admin' | 'seller' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  shop_id?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isLoggedIn: boolean;
  shopId?: string;
}
