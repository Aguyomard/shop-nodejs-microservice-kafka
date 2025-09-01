import { OrderData, PaymentData, EmailData } from '../../../../domain/ports';
import { RetryPattern } from '../../../../shared/patterns/RetryPattern';
import { AnalyticsService } from '../../../../shared/services/AnalyticsService';
import { ErrorHandlingService } from '../../../../shared/services/ErrorHandlingService';

export class PaymentEventHandlers {
  constructor(
    private eventBus: any,
    private retryPattern: RetryPattern,
    private analyticsService: AnalyticsService,
    private errorHandlingService: ErrorHandlingService
  ) {}

  async handlePaymentSuccess(data: any): Promise<void> {
    console.log('✅ PaymentEventHandlers - Payment successful, confirming order with retry');
    console.log('📊 PaymentEventHandlers - Payment data received:', data);
    
    try {
      await this.retryPattern.executeWithRetry(
        () => this.confirmOrderWithRetry(data),
        'Order Confirmation'
      );

      await this.retryPattern.executeWithRetry(
        () => this.sendEmailWithRetry(data),
        'Email Sending'
      );
    } catch (error) {
      console.error('❌ PaymentEventHandlers - Order confirmation failed after retries:', error);
      await this.handleOrderConfirmationFailure(data, error as Error);
    }
  }

  async handlePaymentFailed(data: any): Promise<void> {
    const paymentData = data as PaymentData;
    console.log('❌ PaymentEventHandlers - Payment failed, cancelling order with retry');
    
    try {
      await this.retryPattern.executeWithRetry(
        () => this.compensateOrderWithRetry(paymentData),
        'Order Compensation'
      );
    } catch (compensationError) {
      console.error('❌ PaymentEventHandlers - Compensation failed after retries:', compensationError);
      await this.errorHandlingService.escalateToManualIntervention({
        operation: 'order_compensation',
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        data: paymentData
      }, compensationError as Error);
    }
  }

  private async confirmOrderWithRetry(data: any): Promise<void> {
    await this.analyticsService.publishOrderAnalytics('payment.completed', data);
    
    const originalPaymentData = data.data || data;
    const orderData: OrderData = {
      orderId: originalPaymentData.orderId,
      cart: originalPaymentData.cart,
      userId: originalPaymentData.userId,
      total: originalPaymentData.total,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.confirm', orderData);
        console.log('📤 PaymentEventHandlers - Published order.confirm with retry');
      },
      'Order Confirm Event Publishing'
    );
  }

  private async sendEmailWithRetry(data: any): Promise<void> {
    const originalPaymentData = data.data || data;
    
    await this.analyticsService.publishOrderAnalytics('order.confirm.requested', originalPaymentData);
    
    const emailData: EmailData = {
      orderId: originalPaymentData.orderId,
      userId: originalPaymentData.userId,
      email: 'test@test.com',
      type: 'order_confirmation'
    };
    
    console.log('📧 PaymentEventHandlers - Email data to send:', emailData);
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('email.send', emailData);
        console.log('📤 PaymentEventHandlers - Published email.send with retry');
      },
      'Email Send Event Publishing'
    );
  }

  private async compensateOrderWithRetry(paymentData: PaymentData): Promise<void> {
    await this.analyticsService.publishOrderAnalytics('payment.failed', paymentData);
    
    const orderData: OrderData = {
      orderId: paymentData.orderId,
      cart: paymentData.cart,
      userId: paymentData.userId,
      total: paymentData.total,
      status: 'cancelled',
      createdAt: new Date().toISOString()
    };
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.cancel', orderData);
        console.log('📤 PaymentEventHandlers - Published order.cancel with retry');
      },
      'Order Cancel Event Publishing'
    );
  }

  private async handleOrderConfirmationFailure(data: any, error: Error): Promise<void> {
    console.log('❌ PaymentEventHandlers - Order confirmation failed, compensating');
    
    try {
      await this.retryPattern.executeWithRetry(
        () => this.compensateOrder(data),
        'Order Compensation'
      );
      
      await this.errorHandlingService.trackFailure({
        operation: 'order_confirmation',
        orderId: data.orderId,
        userId: data.userId,
        data: data
      }, error);
      
    } catch (compensationError) {
      console.error('❌ PaymentEventHandlers - Compensation failed after retries:', compensationError);
      await this.errorHandlingService.escalateToManualIntervention({
        operation: 'order_compensation',
        orderId: data.orderId,
        userId: data.userId,
        data: data
      }, compensationError as Error);
    }
  }

  private async compensateOrder(data: any): Promise<void> {
    const orderData = this.buildOrderData(data);
    await this.eventBus.publish('order.cancel', orderData);
    console.log('📤 PaymentEventHandlers - Published order.cancel for compensation');
  }

  private buildOrderData(data: any): OrderData {
    const originalData = data.data || data;
    return {
      orderId: originalData.orderId,
      cart: originalData.cart,
      userId: originalData.userId,
      total: originalData.total,
      status: 'cancelled',
      createdAt: new Date().toISOString()
    };
  }
}
