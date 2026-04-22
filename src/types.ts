export interface Customer {
  id: string;
  code: string;
  customer_code?: string;
  name: string;
  afm: string;
  address: string;
  city: string;
}

export interface Product {
  id?: string;
  code: string;
  Code?: string;
  description: string;
  Description?: string;
  price: number;
  Price?: number;
  brand: string;
  Brand?: string;
  imageUrl?: string;
  ImageUrl?: string;
  imageurl?: string;
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
  id?: string;
  ID?: string;
  name: string;
  logo_url?: string;
  imageUrl?: string;
  is_hidden?: boolean;
}

export type UserRole = 'admin' | 'seller' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  customer_id?: string | null;
  shop_id?: string;
}

export interface SoftOneOrder {
  TRD_AAA: string;
  TRD_DATE: string;
  TRD_CODE: string;
  TRD_NAME: string;
  TRD_AFM: string;
  TOTAL_VALUE: number;
  TRD_TYPE_DESC: string;
  items?: SoftOneOrderItem[];
}

export interface SoftOneOrderItem {
  CODE: string;
  DESCRIPTION: string;
  QUANTITY: number;
  PRICE: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isLoggedIn: boolean;
  customer_id?: string | null;
  shopId?: string;
}
