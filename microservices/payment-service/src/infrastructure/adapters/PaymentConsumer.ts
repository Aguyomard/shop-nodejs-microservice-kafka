import { Kafka, Consumer } from 'kafkajs';
import { IPaymentService, IEventBus } from '../../domain/ports';

export class PaymentConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(
    private paymentService: IPaymentService,
    private eventBus: IEventBus
  ) {
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
      eachMessage: async ({ message }) => {
        try {
          console.log('📥 PaymentConsumer - Received message from payments topic');

          if (!message.value) {
            console.log('⚠️ PaymentConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 PaymentConsumer - Processing event:', eventMessage.eventType);

          // Traiter seulement l'événement 'payment.requested'
          if (eventMessage.eventType === 'payment.requested') {
            const paymentData = eventMessage.data;
            console.log('🔄 PaymentConsumer - Processing payment request:', paymentData);

            // Traiter le paiement
            const result = await this.paymentService.processPayment(paymentData);
            
            // Publier le résultat selon le succès/échec
            if (result.success) {
              await this.eventBus.publish('payment.success', paymentData);
              console.log('✅ PaymentConsumer - Published payment.success');
            } else {
              await this.eventBus.publish('payment.failed', {
                paymentData,
                error: result.error
              });
              console.log('❌ PaymentConsumer - Published payment.failed');
            }
          }

        } catch (error) {
          console.error('❌ PaymentConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const eventMessage = JSON.parse(message.value?.toString() || '{}');
            if (eventMessage.eventType === 'payment.requested') {
              await this.eventBus.publish('payment.failed', {
                paymentData: eventMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ PaymentConsumer - Published payment.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ PaymentConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 PaymentConsumer - Started consuming messages from payments topic');
  }
} 