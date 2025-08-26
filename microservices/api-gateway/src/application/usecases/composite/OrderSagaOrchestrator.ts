import { IEventBus, OrderData, PaymentData, EmailData } from '../../../domain/ports';
import { IOrderSagaOrchestrator } from '../interfaces/IOrderSagaOrchestrator';

export class OrderSagaOrchestrator implements IOrderSagaOrchestrator {
  constructor(private eventBus: IEventBus) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Écouter les résultats du Order Service (Events)
    this.eventBus.subscribe('order.created', this.handleOrderCreatedSuccess.bind(this));
    this.eventBus.subscribe('order.creation.failed', this.handleOrderCreatedFailed.bind(this));
    
    // Écouter les résultats du Payment Service (Events)
    this.eventBus.subscribe('payment.completed', this.handlePaymentSuccess.bind(this));
    this.eventBus.subscribe('payment.failed', this.handlePaymentFailed.bind(this));
    
    // Écouter les résultats du Email Service (Events)
    this.eventBus.subscribe('email.sent', this.handleEmailSentSuccess.bind(this));
    this.eventBus.subscribe('email.failed', this.handleEmailSentFailed.bind(this));
  }

  async startOrderSaga(orderData: OrderData): Promise<void> {
    console.log('🚀 OrderSagaOrchestrator - Starting order saga for:', orderData.orderId);
    
    try {
      // Étape 1: Publier la COMMAND pour créer la commande
      await this.eventBus.publish('order.create', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.create COMMAND');
      
      // Publier l'événement analytics
      await this.publishOrderAnalytics('order.create.requested', orderData);
      console.log('📊 OrderSagaOrchestrator - Published order.create.requested analytics');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error starting saga:', error);
      throw error;
    }
  }

  async handleOrderCreatedSuccess(data: any): Promise<void> {
    const orderData = data as OrderData;
    console.log('✅ OrderSagaOrchestrator - Order created successfully, requesting payment');
    
    try {
      // Étape 2: Publier la COMMAND pour traiter le paiement
      const paymentData: PaymentData = {
        orderId: orderData.orderId,
        cart: orderData.cart,
        userId: orderData.userId,
        total: orderData.total
      };
      
      await this.eventBus.publish('payment.process', paymentData);
      console.log('📤 OrderSagaOrchestrator - Published payment.process COMMAND');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error requesting payment:', error);
      // En cas d'erreur, annuler la commande
      await this.handleOrderCreatedFailed(data, error);
    }
  }

  async handlePaymentSuccess(data: any): Promise<void> {
    // 🔄 CORRECTION : Le data reçu a une structure différente de PaymentData
    console.log('✅ OrderSagaOrchestrator - Payment successful, confirming order');
    console.log('📊 OrderSagaOrchestrator - Payment data received:', data);
    
    try {
      // Publier l'événement analytics de paiement réussi
      await this.publishOrderAnalytics('payment.completed', data);
      console.log('📊 OrderSagaOrchestrator - Published payment.completed analytics');
      
      // 🔄 CORRECTION : Extraire les données originales du wrapper
      const originalPaymentData = data.data || data;
      
      // Étape 3a: Publier la COMMAND pour confirmer la commande
      const orderData: OrderData = {
        orderId: originalPaymentData.orderId,
        cart: originalPaymentData.cart,
        userId: originalPaymentData.userId,
        total: originalPaymentData.total,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      await this.eventBus.publish('order.confirm', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.confirm COMMAND');
      
      // Publier l'événement analytics
      await this.publishOrderAnalytics('order.confirm.requested', orderData);
      console.log('📊 OrderSagaOrchestrator - Published order.confirm.requested analytics');
      
      // Étape 3b: Publier la COMMAND pour envoyer l'email
      // 🔄 CORRECTION : Utiliser les données complètes de la commande
      const emailData: EmailData = {
        orderId: originalPaymentData.orderId,
        userId: originalPaymentData.userId,
        email: 'test@test.com', // TODO: Get from user service
        type: 'order_confirmation'
      };
      
      // 🔄 CORRECTION : Ajouter des logs pour déboguer
      console.log('📧 OrderSagaOrchestrator - Email data to send:', emailData);
      
      await this.eventBus.publish('email.send', emailData);
      console.log('📤 OrderSagaOrchestrator - Published email.send COMMAND');
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error confirming order:', error);
    }
  }

  async handlePaymentFailed(data: any): Promise<void> {
    const paymentData = data as PaymentData;
    console.log('❌ OrderSagaOrchestrator - Payment failed, cancelling order');
    
    try {
      // Publier l'événement analytics de paiement échoué
      await this.publishOrderAnalytics('payment.failed', paymentData);
      console.log('📊 OrderSagaOrchestrator - Published payment.failed analytics');
      
      // Compensation: Publier la COMMAND pour annuler la commande
      const orderData: OrderData = {
        orderId: paymentData.orderId,
        cart: paymentData.cart,
        userId: paymentData.userId,
        total: paymentData.total,
        status: 'cancelled',
        createdAt: new Date().toISOString()
      };
      
      await this.eventBus.publish('order.cancel', orderData);
      console.log('📤 OrderSagaOrchestrator - Published order.cancel COMMAND');
      
      // Publier l'événement analytics
      await this.publishOrderAnalytics('order.cancel.requested', orderData);
      console.log('📊 OrderSagaOrchestrator - Published order.cancel.requested analytics');
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

  // Méthode privée pour publier les événements analytics
  private async publishOrderAnalytics(eventType: string, data: any): Promise<void> {
    try {
      const analyticsData = {
        eventType,
        orderId: data.orderId,
        userId: data.userId,
        data: {
          total: data.total,
          cart: data.cart,
          status: data.status
        },
        timestamp: new Date().toISOString()
      };

      await this.eventBus.publish('analytics.collect', analyticsData);
      console.log('📊 OrderSagaOrchestrator - Published analytics COMMAND:', eventType);
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Error publishing analytics:', error);
      // Ne pas faire échouer la saga si l'analytics échoue
    }
  }
} 