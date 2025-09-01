import { OrderData, PaymentData } from '../../../../domain/ports';
import { RetryPattern } from '../../../../shared/patterns/RetryPattern';
import { ErrorHandlingService } from '../../../../shared/services/ErrorHandlingService';

export class OrderEventHandlers {
  constructor(
    private eventBus: any,
    private retryPattern: RetryPattern,
    private errorHandlingService: ErrorHandlingService
  ) {}

  async handleOrderCreatedSuccess(data: any): Promise<void> {
    const orderData = data as OrderData;
    console.log('✅ OrderEventHandlers - Order created successfully, processing payment with retry');
    
    try {
      await this.retryPattern.executeWithRetry(
        () => this.processPaymentWithRetry(orderData),
        'Payment Processing'
      );
    } catch (error) {
      console.error('❌ OrderEventHandlers - Payment processing failed after retries:', error);
      await this.errorHandlingService.trackFailure({
        operation: 'payment_processing',
        orderId: orderData.orderId,
        userId: orderData.userId,
        data: orderData
      }, error as Error);
    }
  }

  async handleOrderCreatedFailed(_data: any, error?: any): Promise<void> {
    console.log('❌ OrderEventHandlers - Order creation failed:', error);
    console.log('🛑 OrderEventHandlers - Order saga failed at creation step');
  }

  private async processPaymentWithRetry(orderData: OrderData): Promise<void> {
    const paymentData: PaymentData = {
      orderId: orderData.orderId,
      cart: orderData.cart,
      userId: orderData.userId,
      total: orderData.total
    };
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('payment.process', paymentData);
        console.log('📤 OrderEventHandlers - Published payment.process with retry');
      },
      'Payment Process Event Publishing'
    );
  }
}
