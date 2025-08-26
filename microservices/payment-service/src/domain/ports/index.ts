// Types pour les entités métier
export interface PaymentData {
  orderId: string;
  cart: Cart;
  userId: string;
  total: number;
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

export interface PaymentResult {
  orderId: string;
  success: boolean;
  transactionId?: string;
  error?: string;
  processedAt: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerId: string;
}

// Types pour les événements - Nouvelle architecture Commands vs Events
export type EventType = 
  // COMMANDS (ce qu'on veut faire)
  | 'payment.process'
  | 'payment.refund'
  | 'payment.capture'
  | 'analytics.collect'
  // EVENTS (ce qui s'est passé)
  | 'payment.started'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.captured'
  | 'analytics.collected';

export interface EventMessage {
  eventType: EventType;
  data: any;
  timestamp: string;
  correlationId: string;
}

// Ports (Interfaces)
export interface IEventBus {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(eventType: EventType, data: any): Promise<void>;
}

export interface IPaymentService {
  processPayment(paymentData: PaymentData): Promise<PaymentResult>;
  validatePayment(paymentData: PaymentData): boolean;
  generateTransactionId(): string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
} 