
export interface SaleItem {
  id: number;
  product_id?: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentTransaction {
  id: number;
  order_id: number;
  user_id: number;
  transaction_reference: string | null;
  gateway_status: string | null;
  amount: number;
  currency: string;
  created_at: string | null;
}

export interface Sale {
  id: number;
  order_number: string | null;
  user_id: number;
  client_name?: string | null;
  product_id?: number | null;
  product_name?: string | null;
  quantity?: number;
  unit_price?: number;
  total: number;
  total_amount?: number;
  payment_method: string | null;
  status: string;
  created_at: string | null;
  items: SaleItem[];
  payments?: PaymentTransaction[];
}

export interface PurchaseHistoryResponse {
  success: boolean;
  sales: Sale[];
  message?: string;
  error?: string;
}
