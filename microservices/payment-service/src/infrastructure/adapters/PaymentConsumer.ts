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
      // 🔄 NOUVEAU : Écouter les COMMANDS (ce qu'on veut faire)
      await this.consumer.subscribe({ topic: 'payments-commands', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 PaymentConsumer connected to payments-commands topic');
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
          console.log('📥 PaymentConsumer - Received message from payments-commands topic');

          if (!message.value) {
            console.log('⚠️ PaymentConsumer - Empty message received');
            return;
          }

          const commandMessage = JSON.parse(message.value.toString());
          console.log('🔄 PaymentConsumer - Processing command:', commandMessage.eventType);

          // 🔄 NOUVEAU : Traiter les COMMANDS et publier les EVENTS
          switch (commandMessage.eventType) {
            case 'payment.process':
              await this.handlePaymentProcess(commandMessage.data);
              break;
            case 'payment.refund':
              await this.handlePaymentRefund(commandMessage.data);
              break;
            case 'payment.capture':
              await this.handlePaymentCapture(commandMessage.data);
              break;
            default:
              console.log('⚠️ PaymentConsumer - Unknown command:', commandMessage.eventType);
          }

        } catch (error) {
          console.error('❌ PaymentConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const commandMessage = JSON.parse(message.value?.toString() || '{}');
            if (commandMessage.eventType === 'payment.process') {
              await this.eventBus.publish('payment.failed', {
                paymentData: commandMessage.data,
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

    console.log('🚀 PaymentConsumer - Started consuming commands from payments-commands topic');
  }

  // 🔄 NOUVELLES MÉTHODES : Gestion des différentes commands
  private async handlePaymentProcess(paymentData: any): Promise<void> {
    try {
      console.log('🔄 PaymentConsumer - Processing payment.process command:', paymentData);

      // Traiter le paiement
      const result = await this.paymentService.processPayment(paymentData);
      
      // Publier l'EVENT de résultat
      if (result.success) {
        await this.eventBus.publish('payment.completed', {
          orderId: paymentData.orderId,
          data: paymentData,
          timestamp: new Date().toISOString()
        });
        console.log('✅ PaymentConsumer - Published payment.completed EVENT');
      } else {
        await this.eventBus.publish('payment.failed', {
          paymentData,
          error: result.error
        });
        console.log('❌ PaymentConsumer - Published payment.failed EVENT');
      }
    } catch (error) {
      console.error('❌ PaymentConsumer - Error handling payment.process:', error);
      await this.eventBus.publish('payment.failed', {
        paymentData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handlePaymentRefund(paymentData: any): Promise<void> {
    try {
      console.log('🔄 PaymentConsumer - Processing payment.refund command:', paymentData);
      
      // Logique de remboursement
      await this.eventBus.publish('payment.refunded', {
        orderId: paymentData.orderId,
        data: paymentData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ PaymentConsumer - Published payment.refunded EVENT');
    } catch (error) {
      console.error('❌ PaymentConsumer - Error handling payment.refund:', error);
    }
  }

  private async handlePaymentCapture(paymentData: any): Promise<void> {
    try {
      console.log('🔄 PaymentConsumer - Processing payment.capture command:', paymentData);
      
      // Logique de capture de paiement
      await this.eventBus.publish('payment.captured', {
        orderId: paymentData.orderId,
        data: paymentData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ PaymentConsumer - Published payment.captured EVENT');
    } catch (error) {
      console.error('❌ PaymentConsumer - Error handling payment.capture:', error);
    }
  }
} 