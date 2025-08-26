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

// Types pour les événements - Nouvelle architecture Commands vs Events
export type EventType = 
  // COMMANDS (ce qu'on veut faire)
  | 'email.send'
  | 'email.schedule'
  | 'email.cancel'
  | 'analytics.collect'
  // EVENTS (ce qui s'est passé)
  | 'email.sent'
  | 'email.failed'
  | 'email.scheduled'
  | 'email.cancelled'
  | 'email.delivered'
  | 'analytics.collected';

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