import { Kafka, Consumer } from 'kafkajs';
import { IOrderService, IEventBus } from '../../domain/ports';

export class OrderConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(
    private orderService: IOrderService,
    private eventBus: IEventBus
  ) {
    this.kafka = new Kafka({
      clientId: 'order-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'order-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'orders', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 OrderConsumer connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 OrderConsumer disconnected from Kafka');
    }
  }

  async startConsuming(): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          console.log('📥 OrderConsumer - Received message from orders topic');

          if (!message.value) {
            console.log('⚠️ OrderConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 OrderConsumer - Processing event:', eventMessage.eventType);

          // Traiter seulement l'événement 'order.created'
          if (eventMessage.eventType === 'order.created') {
            const orderData = eventMessage.data;
            console.log('🔄 OrderConsumer - Processing order creation:', orderData);

            // Traiter la commande
            const result = await this.orderService.processOrder(orderData);
            
            // Publier le résultat selon le succès/échec
            if (result.success) {
              await this.eventBus.publish('order.created.success', orderData);
              console.log('✅ OrderConsumer - Published order.created.success');
            } else {
              await this.eventBus.publish('order.created.failed', {
                orderData,
                error: result.error
              });
              console.log('❌ OrderConsumer - Published order.created.failed');
            }
          }

        } catch (error) {
          console.error('❌ OrderConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const eventMessage = JSON.parse(message.value?.toString() || '{}');
            if (eventMessage.eventType === 'order.created') {
              await this.eventBus.publish('order.created.failed', {
                orderData: eventMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ OrderConsumer - Published order.created.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ OrderConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 OrderConsumer - Started consuming messages from orders topic');
  }
} 