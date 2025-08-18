import { IPaymentService, IEventBus, PaymentData, PaymentResult } from '../../domain/ports';

export class PaymentService implements IPaymentService {
  constructor(private eventBus: IEventBus) {}

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      console.log('🔄 PaymentService in ts - Processing payment...', { orderId: paymentData.orderId });

      // Validation métier
      if (!this.validatePayment(paymentData)) {
        throw new Error('Invalid payment data');
      }

      // Simulation du traitement de paiement
      const success = Math.random() > 0.1; // 90% de succès
      
      if (success) {
        const transactionId = this.generateTransactionId();
        const result: PaymentResult = {
          orderId: paymentData.orderId,
          success: true,
          transactionId,
          processedAt: new Date().toISOString()
        };

        // Publier l'événement de succès
        await this.eventBus.publish('payment.processed', {
          orderId: paymentData.orderId,
          transactionId,
          amount: paymentData.total,
          processedAt: result.processedAt
        });

        console.log('✅ PaymentService - Payment processed successfully', { orderId: paymentData.orderId, transactionId });
        return result;

      } else {
        const result: PaymentResult = {
          orderId: paymentData.orderId,
          success: false,
          error: 'Payment processing failed',
          processedAt: new Date().toISOString()
        };

        // Publier l'événement d'échec
        await this.eventBus.publish('payment.failed', {
          orderId: paymentData.orderId,
          error: result.error,
          processedAt: result.processedAt
        });

        console.log('❌ PaymentService - Payment processing failed', { orderId: paymentData.orderId });
        return result;
      }

    } catch (error) {
      console.error('❌ PaymentService - Error processing payment:', error);
      
      const result: PaymentResult = {
        orderId: paymentData.orderId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      // Publier l'événement d'échec
      await this.eventBus.publish('payment.failed', {
        orderId: paymentData.orderId,
        error: result.error,
        processedAt: result.processedAt
      });

      return result;
    }
  }

  validatePayment(paymentData: PaymentData): boolean {
    if (!paymentData.orderId || !paymentData.userId) {
      console.log('❌ PaymentService - Missing required fields');
      return false;
    }

    if (paymentData.total <= 0) {
      console.log('❌ PaymentService - Invalid amount');
      return false;
    }

    if (!paymentData.cart || !paymentData.cart.items || paymentData.cart.items.length === 0) {
      console.log('❌ PaymentService - Empty cart');
      return false;
    }

    console.log('✅ PaymentService - Payment data validated');
    return true;
  }

  generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 