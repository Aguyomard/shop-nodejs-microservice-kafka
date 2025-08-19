import { IEventBus, OrderData, PaymentData, EmailData } from '../../../domain/ports';

export class OrderSagaOrchestrator {
  constructor(private eventBus: IEventBus) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Écouter les résultats du Order Service
    this.eventBus.subscribe('order.created.success', this.handleOrderCreatedSuccess.bind(this));
    this.eventBus.subscribe('order.created.failed', this.handleOrderCreatedFailed.bind(this));
    
    // Écouter les résultats du Payment Service
    this.eventBus.subscribe('payment.success', this.handlePaymentSuccess.bind(this));
    this.eventBus.subscribe('payment.failed', this.handlePaymentFailed.bind(this));
    
    // Écouter les résultats du Email Service
    this.eventBus.subscribe('email.sent.success', this.handleEmailSentSuccess.bind(this));
    this.eventBus.subscribe('email.sent.failed', this.handleEmailSentFailed.bind(this));
  }

  async startOrderSaga(orderData: OrderData): Promise<void> {
    console.log('🚀 OrderSagaOrchestrator - Starting order saga for:', orderData.orderId);
    
    try {
      // Étape 1: Créer la commande
      await this.eventBus.publish('order.created', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.created');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error starting saga:', error);
      throw error;
    }
  }

  async handleOrderCreatedSuccess(data: any): Promise<void> {
    const orderData = data as OrderData;
    console.log('✅ OrderSagaOrchestrator - Order created successfully, requesting payment');
    
    try {
      // Étape 2: Demander le paiement
      const paymentData: PaymentData = {
        orderId: orderData.orderId,
        cart: orderData.cart,
        userId: orderData.userId,
        total: orderData.total
      };
      
      await this.eventBus.publish('payment.requested', paymentData);
      console.log('📤 OrderSagaOrchestrator - Published payment.requested');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error requesting payment:', error);
      // En cas d'erreur, annuler la commande
      await this.handleOrderCreatedFailed(data, error);
    }
  }

  async handlePaymentSuccess(data: any): Promise<void> {
    const paymentData = data as PaymentData;
    console.log('✅ OrderSagaOrchestrator - Payment successful, confirming order');
    
    try {
      // Étape 3a: Confirmer la commande
      const orderData: OrderData = {
        orderId: paymentData.orderId,
        cart: paymentData.cart,
        userId: paymentData.userId,
        total: paymentData.total,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      await this.eventBus.publish('order.confirmed', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.confirmed');
      
      // Étape 3b: Demander l'envoi d'email
      const emailData: EmailData = {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        email: 'test@test.com', // TODO: Get from user service
        type: 'order_confirmation'
      };
      
      await this.eventBus.publish('email.requested', emailData);
      console.log('📤 OrderSagaOrchestrator - Published email.requested');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error confirming order:', error);
    }
  }

  async handlePaymentFailed(data: any): Promise<void> {
    const paymentData = data as PaymentData;
    console.log('❌ OrderSagaOrchestrator - Payment failed, cancelling order');
    
    try {
      // Compensation: Annuler la commande
      const orderData: OrderData = {
        orderId: paymentData.orderId,
        cart: paymentData.cart,
        userId: paymentData.userId,
        total: paymentData.total,
        status: 'cancelled',
        createdAt: new Date().toISOString()
      };
      
      await this.eventBus.publish('order.cancelled', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.cancelled');
    } catch (compensationError) {
      console.error('❌ OrderSagaOrchestrator - Error cancelling order:', compensationError);
    }
  }

  async handleEmailSentSuccess(data: any): Promise<void> {
    const emailData = data as EmailData;
    console.log('✅ OrderSagaOrchestrator - Email sent successfully for order:', emailData.orderId);
    console.log('🎉 OrderSagaOrchestrator - Order saga completed successfully!');
  }

  async handleEmailSentFailed(data: any): Promise<void> {
    const emailData = data as EmailData;
    console.log('❌ OrderSagaOrchestrator - Email sending failed for order:', emailData.orderId);
    // L'email peut échouer sans impacter la commande
    console.log('⚠️ OrderSagaOrchestrator - Order completed but email failed');
  }

  async handleOrderCreatedFailed(_data: any, error?: any): Promise<void> {
    console.log('❌ OrderSagaOrchestrator - Order creation failed:', error);
    // La saga s'arrête ici car la commande n'a pas pu être créée
    console.log('🛑 OrderSagaOrchestrator - Order saga failed at creation step');
  }
} 