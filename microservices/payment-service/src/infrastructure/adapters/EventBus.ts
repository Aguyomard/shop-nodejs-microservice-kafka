import { Kafka, Producer } from 'kafkajs';
import { IEventBus, EventType, EventMessage } from '../../domain/ports';

export class EventBus implements IEventBus {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service-event-bus',
      brokers: ['localhost:9092']
    });
    
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('🔌 Payment Service EventBus connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Payment Service EventBus disconnected from Kafka');
    }
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

      console.log(`📤 Payment Service EventBus - Published ${eventType} to ${topic}`);
      
    } catch (error) {
      console.error(`❌ Payment Service EventBus - Error publishing ${eventType}:`, error);
      throw error;
    }
  }

  private getTopicForEvent(eventType: EventType): string {
    const eventToTopicMap: Record<EventType, string> = {
      'payment.processed': 'payment_success',
      'payment.failed': 'payment_failed',
      'analytics.event': 'analytics'
    };

    const topic = eventToTopicMap[eventType];
    if (!topic) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return topic;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 