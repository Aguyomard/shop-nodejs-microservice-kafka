// Types pour les entités métier
export interface EmailData {
  orderId: string;
  userId: string;
  email: string;
  type: 'order_confirmation' | 'payment_confirmation' | 'shipping_notification';
}

export interface EmailResult {
  orderId: string;
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: string;
}

export interface EmailRequest {
  orderId: string;
  to: string;
  subject: string;
  body: string;
  template?: string;
}

// Types pour les événements
export type EventType = 
  // Événements de demande
  | 'email.requested'
  | 'email.sent'
  | 'email.failed'
  | 'analytics.event'
  // Événements de résultat pour la Saga
  | 'email.sent.success'
  | 'email.sent.failed';

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

export interface IEmailService {
  sendEmail(emailData: EmailData): Promise<EmailResult>;
  validateEmail(emailData: EmailData): boolean;
  generateMessageId(): string;
} 