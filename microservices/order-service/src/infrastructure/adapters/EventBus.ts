import { Kafka, Producer } from 'kafkajs';
import { IEventBus, EventType, EventMessage } from '../../domain/ports';

export class EventBus implements IEventBus {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'order-service-event-bus',
      brokers: ['localhost:9092']
    });
    
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('🔌 Order Service EventBus connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Order Service EventBus disconnected from Kafka');
    }
  }

  async publish(eventType: EventType, data: any): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const eventMessage: EventMessage = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const topic = this.getTopicForEvent(eventType);
    
    await this.producer.send({
      topic,
      messages: [
        {
          key: eventMessage.correlationId,
          value: JSON.stringify(eventMessage)
        }
      ]
    });

    console.log(`📤 Order Service EventBus - Published ${eventType} to ${topic}`);
  }

  private getTopicForEvent(eventType: EventType): string {
    const eventToTopicMap: Record<EventType, string> = {
      // Événements de demande
      'order.created': 'orders',
      'order.processed': 'analytics',
      'order.failed': 'analytics',
      'analytics.event': 'analytics',
      // Événements de résultat pour la Saga
      'order.created.success': 'orders',
      'order.created.failed': 'orders',
      'order.confirmed': 'orders',
      'order.cancelled': 'orders'
    };

    const topic = eventToTopicMap[eventType];
    if (!topic) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return topic;
  }
} 