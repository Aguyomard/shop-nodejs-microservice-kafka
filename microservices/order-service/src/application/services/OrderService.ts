import { IOrderService, IEventBus, OrderData, OrderResult } from '../../domain/ports';

export class OrderService implements IOrderService {
  constructor(private eventBus: IEventBus) {}

  async processOrder(orderData: OrderData): Promise<OrderResult> {
    try {
      console.log('🔄 OrderService - Processing order...', { orderId: orderData.orderId });

      // Validation métier
      if (!this.validateOrder(orderData)) {
        throw new Error('Invalid order data');
      }

      // Simulation du traitement de commande
      const success = Math.random() > 0.05; // 95% de succès
      
      if (success) {
        const result: OrderResult = {
          orderId: orderData.orderId,
          success: true,
          status: 'completed',
          processedAt: new Date().toISOString()
        };

        // Publier l'événement de succès
        await this.eventBus.publish('order.processed', {
          orderId: orderData.orderId,
          status: 'completed',
          total: orderData.total,
          processedAt: result.processedAt
        });

        console.log('✅ OrderService - Order processed successfully', { orderId: orderData.orderId });
        return result;

      } else {
        const result: OrderResult = {
          orderId: orderData.orderId,
          success: false,
          status: 'failed',
          error: 'Order processing failed',
          processedAt: new Date().toISOString()
        };

        // Publier l'événement d'échec
        await this.eventBus.publish('order.failed', {
          orderId: orderData.orderId,
          error: result.error,
          processedAt: result.processedAt
        });

        console.log('❌ OrderService - Order processing failed', { orderId: orderData.orderId });
        return result;
      }

    } catch (error) {
      console.error('❌ OrderService - Error processing order:', error);
      
      const result: OrderResult = {
        orderId: orderData.orderId,
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      // Publier l'événement d'échec
      await this.eventBus.publish('order.failed', {
        orderId: orderData.orderId,
        error: result.error,
        processedAt: result.processedAt
      });

      return result;
    }
  }

  validateOrder(orderData: OrderData): boolean {
    if (!orderData.orderId || !orderData.userId) {
      console.log('❌ OrderService - Missing required fields');
      return false;
    }

    if (orderData.total <= 0) {
      console.log('❌ OrderService - Invalid amount');
      return false;
    }

    if (!orderData.cart || !orderData.cart.items || orderData.cart.items.length === 0) {
      console.log('❌ OrderService - Empty cart');
      return false;
    }

    console.log('✅ OrderService - Order data validated');
    return true;
  }

  generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 