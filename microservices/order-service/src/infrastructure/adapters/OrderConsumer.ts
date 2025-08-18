import { Kafka, Consumer } from 'kafkajs';
import { IOrderService } from '../../domain/ports';

export class OrderConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(private orderService: IOrderService) {
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
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('📥 OrderConsumer - Received message:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: message.value?.toString()
          });

          if (!message.value) {
            console.log('⚠️ OrderConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 OrderConsumer - Processing event message:', eventMessage);

          // Extraire les données de commande du wrapper EventMessage
          const orderData = eventMessage.data;
          console.log('🔄 OrderConsumer - Extracted order data:', orderData);

          // Traiter la commande
          const result = await this.orderService.processOrder(orderData);
          console.log('✅ OrderConsumer - Order processing completed:', result);

        } catch (error) {
          console.error('❌ OrderConsumer - Error processing message:', error);
        }
      }
    });

    console.log('🚀 OrderConsumer - Started consuming messages from orders topic');
  }
} 