import { Kafka, Consumer } from 'kafkajs';
import { IPaymentService } from '../../domain/ports';

export class PaymentConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(private paymentService: IPaymentService) {
    this.kafka = new Kafka({
      clientId: 'payment-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'payment-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'payments', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 PaymentConsumer connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 PaymentConsumer disconnected from Kafka');
    }
  }

  async startConsuming(): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('📥 PaymentConsumer - Received message:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: message.value?.toString()
          });

          if (!message.value) {
            console.log('⚠️ PaymentConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 PaymentConsumer - Processing event message:', eventMessage);

          // Extraire les données de paiement du wrapper EventMessage
          const paymentData = eventMessage.data;
          console.log('🔄 PaymentConsumer - Extracted payment data:', paymentData);

          // Traiter le paiement
          const result = await this.paymentService.processPayment(paymentData);
          console.log('✅ PaymentConsumer - Payment processing completed:', result);

        } catch (error) {
          console.error('❌ PaymentConsumer - Error processing message:', error);
        }
      }
    });

    console.log('🚀 PaymentConsumer - Started consuming messages from payments topic');
  }
} 