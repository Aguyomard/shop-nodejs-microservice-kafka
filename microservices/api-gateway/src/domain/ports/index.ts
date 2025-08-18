// Types pour les entités métier
export interface CartItem {
  id: number;
  name: string;
  price: number;
  icon?: string;
  description?: string;
}

export interface Cart {
  items: CartItem[];
}

export interface OrderData {
  orderId: string;
  cart: Cart;
  userId: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaymentData {
  orderId: string;
  cart: Cart;
  userId: string;
  total: number;
}

export interface EmailData {
  orderId: string;
  userId: string;
  email: string;
  type: 'order_confirmation' | 'payment_confirmation' | 'shipping_notification';
}

// Types pour les événements
export type EventType = 
  | 'order.created'
  | 'payment.requested'
  | 'email.requested'
  | 'analytics.event';

export interface EventMessage {
  eventType: EventType;
  data: OrderData | PaymentData | EmailData;
  timestamp: string;
  correlationId: string;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface OrderResponse {
  orderId: string;
  status: string;
  message: string;
  timestamp: string;
}

// Export des ports organisés par catégorie
export * from './primary';
export * from './secondary'; 