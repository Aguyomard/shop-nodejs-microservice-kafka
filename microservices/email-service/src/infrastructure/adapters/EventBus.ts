import { Kafka, Producer } from 'kafkajs';
import { IEventBus, EventType, EventMessage } from '../../domain/ports';

export class EventBus implements IEventBus {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'email-service-event-bus',
      brokers: ['localhost:9092']
    });
    
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('🔌 Email Service EventBus connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Email Service EventBus disconnected from Kafka');
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

    console.log(`📤 Email Service EventBus - Published ${eventType} to ${topic}`);
  }

  private getTopicForEvent(eventType: EventType): string {
    // COMMANDS (ce qu'on veut faire) → Topics commands
    if (eventType.endsWith('.send') || eventType.endsWith('.schedule') || 
        eventType.endsWith('.cancel') || eventType.endsWith('.collect')) {
      
      if (eventType.startsWith('email.')) return 'emails-commands';
      if (eventType.startsWith('analytics.')) return 'analytics-commands';
    }
    
    // EVENTS (ce qui s'est passé) → Topics events
    if (eventType.startsWith('email.')) return 'emails-events';
    if (eventType.startsWith('analytics.')) return 'analytics-events';
    
    // Fallback pour les événements cross-domain
    return 'business-events';
  }
} 