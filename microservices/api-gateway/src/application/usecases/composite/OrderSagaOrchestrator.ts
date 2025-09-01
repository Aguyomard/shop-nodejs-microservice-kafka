import { IEventBus, OrderData } from '../../../domain/ports';
import { IOrderSagaOrchestrator } from '../interfaces/IOrderSagaOrchestrator';
import { RetryPattern } from '../../../shared/patterns/RetryPattern';
import { AnalyticsService } from '../../../shared/services/AnalyticsService';
import { ErrorHandlingService } from '../../../shared/services/ErrorHandlingService';
import { OrderEventHandlers } from './handlers/OrderEventHandlers';
import { PaymentEventHandlers } from './handlers/PaymentEventHandlers';
import { EmailEventHandlers } from './handlers/EmailEventHandlers';

export class OrderSagaOrchestrator implements IOrderSagaOrchestrator {
  private retryPattern: RetryPattern;
  private analyticsService: AnalyticsService;
  private errorHandlingService: ErrorHandlingService;
  private orderEventHandlers: OrderEventHandlers;
  private paymentEventHandlers: PaymentEventHandlers;
  private emailEventHandlers: EmailEventHandlers;

  constructor(private eventBus: IEventBus) {
    this.retryPattern = new RetryPattern(3, 1000, 5000);
    this.analyticsService = new AnalyticsService(eventBus);
    this.errorHandlingService = new ErrorHandlingService(eventBus);
    
    // Initialiser les handlers avec leurs dépendances
    this.orderEventHandlers = new OrderEventHandlers(
      eventBus, 
      this.retryPattern, 
      this.errorHandlingService
    );
    
    this.paymentEventHandlers = new PaymentEventHandlers(
      eventBus, 
      this.retryPattern, 
      this.analyticsService, 
      this.errorHandlingService
    );
    
    this.emailEventHandlers = new EmailEventHandlers();
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Déléguer aux handlers spécialisés
    this.eventBus.subscribe('order.created', this.orderEventHandlers.handleOrderCreatedSuccess.bind(this.orderEventHandlers));
    this.eventBus.subscribe('order.creation.failed', this.orderEventHandlers.handleOrderCreatedFailed.bind(this.orderEventHandlers));
    
    this.eventBus.subscribe('payment.completed', this.paymentEventHandlers.handlePaymentSuccess.bind(this.paymentEventHandlers));
    this.eventBus.subscribe('payment.failed', this.paymentEventHandlers.handlePaymentFailed.bind(this.paymentEventHandlers));
    
    this.eventBus.subscribe('email.sent', this.emailEventHandlers.handleEmailSentSuccess.bind(this.emailEventHandlers));
    this.eventBus.subscribe('email.failed', this.emailEventHandlers.handleEmailSentFailed.bind(this.emailEventHandlers));
  }

  async startOrderSaga(orderData: OrderData): Promise<void> {
    console.log('🚀 OrderSagaOrchestrator - Starting order saga with retry for:', orderData.orderId);
    
    try {
      await this.retryPattern.executeWithRetry(
        () => this.createOrderWithRetry(orderData),
        'Order Creation'
      );

      console.log('✅ OrderSagaOrchestrator - Order saga started successfully');
      
    } catch (error) {
      console.error('❌ OrderSagaOrchestrator - Failed to start saga after retries:', error);
      await this.errorHandlingService.trackFailure({
        operation: 'saga_start',
        orderId: orderData.orderId,
        userId: orderData.userId,
        data: orderData
      }, error as Error);
      throw error;
    }
  }

  private async createOrderWithRetry(orderData: OrderData): Promise<void> {
    return this.retryPattern.executeWithRetry(
      async () => {
        await this.eventBus.publish('order.create', orderData);
        console.log('📤 OrderSagaOrchestrator - Published order.create with retry');
        
        await this.analyticsService.publishOrderAnalytics('order.create.requested', orderData);
        console.log('📊 OrderSagaOrchestrator - Published order.create.requested analytics');
      },
      'Order Create Event Publishing'
    );
  }

} 