const { Kafka } = require('kafkajs');

class EventBus {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'api-gateway-event-bus',
      brokers: ['localhost:9092']
    });
    
    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('🔌 EventBus connected to Kafka');
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 EventBus disconnected from Kafka');
    }
  }

  async publish(eventType, data) {
    try {
      await this.connect();
      
      const topic = this.getTopicForEvent(eventType);
      const message = {
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

  getTopicForEvent(eventType) {
    const eventToTopicMap = {
      'order.created': 'orders',
      'payment.requested': 'payments',
      'email.requested': 'emails',
      'analytics.event': 'analytics'
    };

    const topic = eventToTopicMap[eventType];
    if (!topic) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return topic;
  }

  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = EventBus; 