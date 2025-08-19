import { IAnalyticsService, IEventBus, AnalyticsData, AnalyticsResult } from '../../domain/ports';

export class AnalyticsService implements IAnalyticsService {
  private orderMetrics: Map<string, any> = new Map();

  constructor(private eventBus: IEventBus) {}

  async processEvent(eventData: AnalyticsData): Promise<AnalyticsResult> {
    try {
      console.log('🔄 AnalyticsService - Processing order analytics event...', { 
        eventType: eventData.eventType, 
        orderId: eventData.orderId 
      });

      // Validation métier
      if (!this.validateEvent(eventData)) {
        throw new Error('Invalid analytics data');
      }

      // Traitement spécifique aux événements d'orders
      const result = await this.processOrderEvent(eventData);

      console.log('✅ AnalyticsService - Order analytics processed successfully', { 
        eventId: result.eventId, 
        eventType: eventData.eventType 
      });
      return result;

    } catch (error) {
      console.error('❌ AnalyticsService - Error processing order analytics:', error);
      
      const result: AnalyticsResult = {
        eventId: this.generateEventId(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      return result;
    }
  }

  private async processOrderEvent(eventData: AnalyticsData): Promise<AnalyticsResult> {
    const eventId = this.generateEventId();
    const processedAt = new Date().toISOString();

    // Traitement spécifique selon le type d'événement
    switch (eventData.eventType) {
      case 'order.created':
        await this.trackOrderCreated(eventData, eventId);
        break;
      
      case 'order.confirmed':
        await this.trackOrderConfirmed(eventData, eventId);
        break;
      
      case 'order.cancelled':
        await this.trackOrderCancelled(eventData, eventId);
        break;
      
      case 'payment.success':
        await this.trackPaymentSuccess(eventData, eventId);
        break;
      
      case 'payment.failed':
        await this.trackPaymentFailed(eventData, eventId);
        break;
      
      default:
        console.log('⚠️ AnalyticsService - Unknown order event type:', eventData.eventType);
    }

    return {
      eventId,
      success: true,
      processedAt
    };
  }

  private async trackOrderCreated(eventData: AnalyticsData, eventId: string): Promise<void> {
    const orderId = eventData.orderId;
    if (!orderId) {
      console.log('⚠️ AnalyticsService - Missing orderId for order.created event');
      return;
    }

    const orderMetrics = {
      orderId,
      createdAt: eventData.timestamp,
      status: 'created',
      total: eventData.data?.total || 0,
      itemCount: eventData.data?.cart?.length || 0,
      userId: eventData.userId
    };

    this.orderMetrics.set(orderId, orderMetrics);

    console.log('📊 AnalyticsService - Order created tracked:', {
      eventId,
      orderId,
      total: orderMetrics.total,
      itemCount: orderMetrics.itemCount
    });

    // Publier l'événement analytics traité
    await this.eventBus.publish('analytics.processed', {
      eventId,
      eventType: 'order.created',
      orderId,
      metrics: orderMetrics,
      processedAt: new Date().toISOString()
    });
  }

  private async trackOrderConfirmed(eventData: AnalyticsData, eventId: string): Promise<void> {
    const orderId = eventData.orderId;
    if (!orderId) {
      console.log('⚠️ AnalyticsService - Missing orderId for order.confirmed event');
      return;
    }

    const existingMetrics = this.orderMetrics.get(orderId);

    if (existingMetrics) {
      existingMetrics.confirmedAt = eventData.timestamp;
      existingMetrics.status = 'confirmed';
      existingMetrics.processingTime = Date.now() - new Date(existingMetrics.createdAt).getTime();

      console.log('📊 AnalyticsService - Order confirmed tracked:', {
        eventId,
        orderId,
        processingTime: existingMetrics.processingTime
      });

      await this.eventBus.publish('analytics.processed', {
        eventId,
        eventType: 'order.confirmed',
        orderId,
        metrics: existingMetrics,
        processedAt: new Date().toISOString()
      });
    }
  }

  private async trackOrderCancelled(eventData: AnalyticsData, eventId: string): Promise<void> {
    const orderId = eventData.orderId;
    if (!orderId) {
      console.log('⚠️ AnalyticsService - Missing orderId for order.cancelled event');
      return;
    }

    const existingMetrics = this.orderMetrics.get(orderId);

    if (existingMetrics) {
      existingMetrics.cancelledAt = eventData.timestamp;
      existingMetrics.status = 'cancelled';
      existingMetrics.cancelReason = eventData.data?.reason || 'unknown';

      console.log('📊 AnalyticsService - Order cancelled tracked:', {
        eventId,
        orderId,
        cancelReason: existingMetrics.cancelReason
      });

      await this.eventBus.publish('analytics.processed', {
        eventId,
        eventType: 'order.cancelled',
        orderId,
        metrics: existingMetrics,
        processedAt: new Date().toISOString()
      });
    }
  }

  private async trackPaymentSuccess(eventData: AnalyticsData, eventId: string): Promise<void> {
    const orderId = eventData.orderId;
    if (!orderId) {
      console.log('⚠️ AnalyticsService - Missing orderId for payment.success event');
      return;
    }

    const existingMetrics = this.orderMetrics.get(orderId);

    if (existingMetrics) {
      existingMetrics.paymentSuccessAt = eventData.timestamp;
      existingMetrics.paymentStatus = 'success';
      existingMetrics.paymentAmount = eventData.data?.total || existingMetrics.total;

      console.log('📊 AnalyticsService - Payment success tracked:', {
        eventId,
        orderId,
        paymentAmount: existingMetrics.paymentAmount
      });

      await this.eventBus.publish('analytics.processed', {
        eventId,
        eventType: 'payment.success',
        orderId,
        metrics: existingMetrics,
        processedAt: new Date().toISOString()
      });
    }
  }

  private async trackPaymentFailed(eventData: AnalyticsData, eventId: string): Promise<void> {
    const orderId = eventData.orderId;
    if (!orderId) {
      console.log('⚠️ AnalyticsService - Missing orderId for payment.failed event');
      return;
    }

    const existingMetrics = this.orderMetrics.get(orderId);

    if (existingMetrics) {
      existingMetrics.paymentFailedAt = eventData.timestamp;
      existingMetrics.paymentStatus = 'failed';
      existingMetrics.paymentError = eventData.data?.error || 'unknown';

      console.log('📊 AnalyticsService - Payment failed tracked:', {
        eventId,
        orderId,
        paymentError: existingMetrics.paymentError
      });

      await this.eventBus.publish('analytics.processed', {
        eventId,
        eventType: 'payment.failed',
        orderId,
        metrics: existingMetrics,
        processedAt: new Date().toISOString()
      });
    }
  }

  validateEvent(eventData: AnalyticsData): boolean {
    if (!eventData.eventType) {
      console.log('❌ AnalyticsService - Missing event type');
      return false;
    }

    if (!eventData.timestamp) {
      console.log('❌ AnalyticsService - Missing timestamp');
      return false;
    }

    // Validation spécifique aux événements d'orders
    const orderEvents = ['order.created', 'order.confirmed', 'order.cancelled', 'payment.success', 'payment.failed'];
    if (orderEvents.includes(eventData.eventType) && !eventData.orderId) {
      console.log('❌ AnalyticsService - Missing orderId for order event');
      return false;
    }

    console.log('✅ AnalyticsService - Order analytics event validated');
    return true;
  }

  generateEventId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Méthode pour obtenir les métriques d'un order (pour debug/API)
  getOrderMetrics(orderId: string): any {
    return this.orderMetrics.get(orderId);
  }

  // Méthode pour obtenir toutes les métriques (pour debug/API)
  getAllOrderMetrics(): any[] {
    return Array.from(this.orderMetrics.values());
  }
} 