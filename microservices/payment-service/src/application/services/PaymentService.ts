import { IPaymentService, PaymentData, PaymentResult } from '../../domain/ports';

export class PaymentService implements IPaymentService {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      console.log('🔄 PaymentService - Processing payment...', { orderId: paymentData.orderId });

      // Validation métier
      if (!this.validatePayment(paymentData)) {
        throw new Error('Invalid payment data');
      }

      // Simulation du traitement de paiement
      await this.simulatePaymentProcessing(paymentData);

      const transactionId = this.generateTransactionId();
      const result: PaymentResult = {
        orderId: paymentData.orderId,
        success: true,
        transactionId,
        processedAt: new Date().toISOString()
      };

      console.log('✅ PaymentService - Payment processed successfully', { orderId: paymentData.orderId, transactionId });
      return result;

    } catch (error) {
      console.error('❌ PaymentService - Error processing payment:', error);
      
      const result: PaymentResult = {
        orderId: paymentData.orderId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      return result;
    }
  }

  private async simulatePaymentProcessing(paymentData: PaymentData): Promise<void> {
    // Simulation d'un traitement de paiement (appel API bancaire, etc.)
    console.log('💳 PaymentService - Processing payment with bank...', { orderId: paymentData.orderId });
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simuler un échec aléatoire (10% de chance)
    if (Math.random() < 0.1) {
      throw new Error('Payment declined by bank');
    }
    
    console.log('💳 PaymentService - Payment approved by bank');
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