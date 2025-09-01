import { Kafka, Producer, Consumer } from 'kafkajs';
import { IEventBus, EventType, EventMessage } from '../../domain/ports';

export class EventBus implements IEventBus {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected: boolean = false;
  private eventHandlers: Map<EventType, Array<(data: any) => Promise<void>>> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'api-gateway-event-bus',
      brokers: ['localhost:9092']
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'api-gateway-consumer' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      console.log('🔌 EventBus connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 EventBus disconnected from Kafka');
    }
  }

  async subscribe(eventType: EventType, handler: (data: any) => Promise<void>): Promise<void> {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
    console.log(`📥 EventBus - Subscribed to ${eventType}`);
    
    // S'abonner au topic Kafka correspondant
    const topic = this.getTopicForEvent(eventType);
    await this.consumer.subscribe({ topic, fromBeginning: false });
    
    // Démarrer la consommation si pas déjà fait
    await this.startConsuming();
  }

  private async startConsuming(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const eventMessage: EventMessage = JSON.parse(message.value?.toString() || '{}');
          const handlers = this.eventHandlers.get(eventMessage.eventType);
          
          if (handlers) {
            console.log(`📥 EventBus - Received ${eventMessage.eventType} from ${topic}`);
            for (const handler of handlers) {
              await handler(eventMessage.data);
            }
          }
        } catch (error) {
          console.error('❌ EventBus - Error processing message:', error);
        }
      }
    });
  }

  async publish(eventType: EventType, data: any): Promise<void> {
    try {
      await this.connect();
      
      const topic = this.getTopicForEvent(eventType);
      const message: EventMessage = {
        eventType,
        data,
        timestamp: new Date().toISOString(),
        correlationId: this.generateCorrelationId()
      };

      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }]
      });

      console.log(`📤 EventBus - Published ${eventType} to ${topic}`);
      
    } catch (error) {
      console.error(`❌ EventBus - Error publishing ${eventType}:`, error);
      throw error;
    }
  }

  private getTopicForEvent(eventType: EventType): string {
    // ERROR EVENTS → Topics d'erreurs spécialisés (Architecture Classique)
    if (eventType.startsWith('error.')) {
      return 'error-events';
    }
    
    // MONITORING EVENTS → Topics de monitoring et observabilité
    if (eventType.startsWith('monitoring.')) {
      return 'monitoring-events';
    }
    
    // COMMANDS (ce qu'on veut faire) → Topics commands
    if (eventType.endsWith('.create') || eventType.endsWith('.update') || 
        eventType.endsWith('.confirm') || eventType.endsWith('.cancel') ||
        eventType.endsWith('.process') || eventType.endsWith('.refund') ||
        eventType.endsWith('.capture') || eventType.endsWith('.send') ||
        eventType.endsWith('.schedule') || eventType.endsWith('.collect') ||
        eventType.endsWith('.export')) {
      
      if (eventType.startsWith('order.')) return 'orders-commands';
      if (eventType.startsWith('payment.')) return 'payments-commands';
      if (eventType.startsWith('email.')) return 'emails-commands';
      if (eventType.startsWith('analytics.')) return 'analytics-commands';
    }
    
    // EVENTS (ce qui s'est passé) → Topics events
    if (eventType.startsWith('order.')) return 'orders-events';
    if (eventType.startsWith('payment.')) return 'payments-events';
    if (eventType.startsWith('email.')) return 'emails-events';
    if (eventType.startsWith('analytics.')) return 'analytics-events';
    
    // Fallback pour les événements cross-domain
    return 'business-events';
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 