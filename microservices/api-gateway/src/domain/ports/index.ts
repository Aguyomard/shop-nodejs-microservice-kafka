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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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

// Types pour les événements - Nouvelle architecture Commands vs Events
export type EventType = 
  // COMMANDS (ce qu'on veut faire)
  | 'order.create'
  | 'order.update'
  | 'order.confirm'
  | 'order.cancel'
  | 'payment.process'
  | 'payment.refund'
  | 'payment.capture'
  | 'email.send'
  | 'email.schedule'
  | 'email.cancel'
  | 'analytics.collect'
  | 'analytics.export'
  // EVENTS (ce qui s'est passé)
  | 'order.created'
  | 'order.updated'
  | 'order.confirmed'
  | 'order.cancelled'
  | 'order.creation.failed'
  | 'payment.started'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'email.sent'
  | 'email.failed'
  | 'email.delivered'
  | 'analytics.collected'
  | 'analytics.exported'
  // ERROR HANDLING (Architecture Classique)
  | 'error.retry_exhausted'
  | 'error.circuit_breaker_open'
  | 'error.timeout'
  | 'error.validation_failed'
  | 'error.business_rule_violation'
  | 'error.infrastructure_failure'
  | 'error.dead_letter_queued'
  | 'error.manual_intervention_required'
  // MONITORING & OBSERVABILITY
  | 'monitoring.failure'
  | 'monitoring.retry_attempt'
  | 'monitoring.circuit_breaker_state_change'
  | 'monitoring.service_health_check'
  | 'monitoring.performance_metrics';

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