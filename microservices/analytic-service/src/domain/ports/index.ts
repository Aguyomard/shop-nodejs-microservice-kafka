// Types pour les entités métier
export interface AnalyticsEvent {
  eventType: string;
  orderId?: string;
  userId?: string;
  data: any;
  timestamp: string;
  correlationId: string;
}

export interface AnalyticsResult {
  eventId: string;
  success: boolean;
  processedAt: string;
  error?: string;
}

export interface AnalyticsData {
  eventType: string;
  orderId?: string;
  userId?: string;
  data: any;
  timestamp: string;
}

// Types pour les événements
export type EventType = 
  | 'analytics.processed'
  | 'analytics.failed';

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

export interface IAnalyticsService {
  processEvent(eventData: AnalyticsData): Promise<AnalyticsResult>;
  validateEvent(eventData: AnalyticsData): boolean;
  generateEventId(): string;
  getOrderMetrics(orderId: string): any;
  getAllOrderMetrics(): any[];
} 