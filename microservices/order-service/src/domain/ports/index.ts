// Types pour les entités métier
export interface OrderData {
  orderId: string;
  cart: Cart;
  userId: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface Cart {
  items: CartItem[];
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  icon?: string;
  description?: string;
}

export interface OrderResult {
  orderId: string;
  success: boolean;
  status: string;
  error?: string;
  processedAt: string;
}

export interface OrderRequest {
  orderId: string;
  cart: Cart;
  userId: string;
  total: number;
}

// Types pour les événements
export type EventType = 
  | 'order.processed'
  | 'order.failed'
  | 'analytics.event';

export interface EventMessage {
  eventType: EventType;
  data: any;
  timestamp: string;
  correlationId: string;
}

// Interfaces (Ports)
export interface IEventBus {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(eventType: EventType, data: any): Promise<void>;
}

export interface IOrderService {
  processOrder(orderData: OrderData): Promise<OrderResult>;
  validateOrder(orderData: OrderData): boolean;
  generateOrderId(): string;
} 