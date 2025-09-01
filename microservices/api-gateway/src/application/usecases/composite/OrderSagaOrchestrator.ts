import { IEventBus, OrderData, PaymentData, EmailData } from '../../../domain/ports';
import { IOrderSagaOrchestrator } from '../interfaces/IOrderSagaOrchestrator';
import { RetryPattern } from '../../../shared/patterns/RetryPattern';

export class OrderSagaOrchestrator implements IOrderSagaOrchestrator {
  private retryPattern: RetryPattern;

  constructor(private eventBus: IEventBus) {
    this.retryPattern = new RetryPattern(3, 1000, 5000);
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
    console.log('🚀 OrderSagaOrchestrator - Starting order saga with retry for:', orderData.orderId);
    
    try {
      // Étape 1: Créer la commande avec retry
      await this.retryPattern.executeWithRetry(
        () => this.createOrderWithRetry(orderData),
        'Order Creation'
      );

      console.log('✅ OrderSagaOrchestrator - Order saga started successfully');
      
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Failed to start saga after retries:', error);
      await this.handleSagaStartFailure(orderData, error as Error);
      throw error;
    }
  }

  private async createOrderWithRetry(orderData: OrderData): Promise<void> {
    // Retry au niveau de l'event publishing
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.create', orderData);
        console.log('📤 OrderSagaOrchestrator - Published order.create with retry');
        
        // Publier l'événement analytics
        await this.publishOrderAnalytics('order.create.requested', orderData);
        console.log('📊 OrderSagaOrchestrator - Published order.create.requested analytics');
      },
      'Order Create Event Publishing'
    );
  }

  async handleOrderCreatedSuccess(data: any): Promise<void> {
    const orderData = data as OrderData;
    console.log('✅ OrderSagaOrchestrator - Order created successfully, processing payment with retry');
    
    try {
      // Étape 2: Traiter le paiement avec retry
      await this.retryPattern.executeWithRetry(
        () => this.processPaymentWithRetry(orderData),
        'Payment Processing'
      );
      
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Payment processing failed after retries:', error);
      await this.handleOrderCreatedFailed(data, error as Error);
    }
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
        console.log('📤 OrderSagaOrchestrator - Published payment.process with retry');
      },
      'Payment Process Event Publishing'
    );
  }

  async handlePaymentSuccess(data: any): Promise<void> {
    // 🔄 CORRECTION : Le data reçu a une structure différente de PaymentData
    console.log('✅ OrderSagaOrchestrator - Payment successful, confirming order with retry');
    console.log('📊 OrderSagaOrchestrator - Payment data received:', data);
    
    try {
      // Étape 3a: Confirmer la commande avec retry
      await this.retryPattern.executeWithRetry(
        () => this.confirmOrderWithRetry(data),
        'Order Confirmation'
      );

      // Étape 3b: Envoyer l'email avec retry
      await this.retryPattern.executeWithRetry(
        () => this.sendEmailWithRetry(data),
        'Email Sending'
      );
      
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Order confirmation failed after retries:', error);
      await this.handleOrderConfirmationFailure(data, error as Error);
    }
  }

  private async confirmOrderWithRetry(data: any): Promise<void> {
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
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.confirm', orderData);
        console.log('📤 OrderSagaOrchestrator - Published order.confirm with retry');
      },
      'Order Confirm Event Publishing'
    );
  }

  private async sendEmailWithRetry(data: any): Promise<void> {
    // 🔄 CORRECTION : Extraire les données originales du wrapper
    const originalPaymentData = data.data || data;
    
    // Publier l'événement analytics
    await this.publishOrderAnalytics('order.confirm.requested', originalPaymentData);
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
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('email.send', emailData);
        console.log('📤 OrderSagaOrchestrator - Published email.send with retry');
      },
      'Email Send Event Publishing'
    );
  }

  async handlePaymentFailed(data: any): Promise<void> {
    const paymentData = data as PaymentData;
    console.log('❌ OrderSagaOrchestrator - Payment failed, cancelling order with retry');
    
    try {
      // Compensation: Annuler la commande avec retry
      await this.retryPattern.executeWithRetry(
        () => this.compensateOrderWithRetry(paymentData),
        'Order Compensation'
      );
      
    } catch (compensationError) {
      console.error('❌ OrderSagaOrchestrator - Compensation failed after retries:', compensationError);
      await this.escalateToManualIntervention(paymentData, compensationError as Error);
    }
  }

  private async compensateOrderWithRetry(paymentData: PaymentData): Promise<void> {
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
    
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.cancel', orderData);
        console.log('📤 OrderSagaOrchestrator - Published order.cancel with retry');
      },
      'Order Cancel Event Publishing'
    );
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

  // Méthodes de gestion des échecs avec retry
  private async handleSagaStartFailure(orderData: OrderData, error: Error): Promise<void> {
    console.log('🛑 OrderSagaOrchestrator - Saga start failed, no compensation needed');
    await this.trackFailure('saga_start', error, orderData);
  }

  private async handleOrderConfirmationFailure(data: any, error: Error): Promise<void> {
    console.log('❌ OrderSagaOrchestrator - Order confirmation failed, compensating');
    
    try {
      // Compensation: Annuler la commande avec retry
      await this.retryPattern.executeWithRetry(
        () => this.compensateOrder(data),
        'Order Compensation'
      );
      
      await this.trackFailure('order_confirmation', error, data);
      
    } catch (compensationError) {
      console.error('❌ OrderSagaOrchestrator - Compensation failed after retries:', compensationError);
      await this.escalateToManualIntervention(data, compensationError as Error);
    }
  }

  private async compensateOrder(data: any): Promise<void> {
    const orderData = this.buildOrderData(data);
    await this.eventBus.publish('order.cancel', orderData);
    console.log('📤 OrderSagaOrchestrator - Published order.cancel for compensation');
  }

  private async trackFailure(operation: string, error: Error, context: any): Promise<void> {
    // Publier l'événement de monitoring avec contexte détaillé
    await this.eventBus.publish('monitoring.failure', {
      operation,
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
      retryAttempts: 3, // Nombre de tentatives effectuées
      sagaStep: operation,
      severity: this.determineErrorSeverity(error)
    });
  }

  private async escalateToManualIntervention(data: any, error: Error): Promise<void> {
    // Publier l'événement d'erreur critique nécessitant une intervention manuelle
    await this.eventBus.publish('error.manual_intervention_required', {
      orderId: data.orderId,
      error: error.message,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      context: {
        sagaStep: 'compensation',
        originalError: error.message,
        retryAttempts: 3
      }
    });
    console.log('🚨 OrderSagaOrchestrator - Escalated to manual intervention');
  }

  // Méthode pour déterminer la sévérité de l'erreur
  private determineErrorSeverity(error: Error): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return 'MEDIUM'; // Erreurs temporaires
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('business rule')) {
      return 'LOW'; // Erreurs de validation
    }
    
    if (errorMessage.includes('infrastructure') || errorMessage.includes('database')) {
      return 'HIGH'; // Erreurs d'infrastructure
    }
    
    if (errorMessage.includes('compensation') || errorMessage.includes('saga')) {
      return 'CRITICAL'; // Erreurs critiques de la saga
    }
    
    return 'MEDIUM'; // Par défaut
  }

  // Méthodes utilitaires
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