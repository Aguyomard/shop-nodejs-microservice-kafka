import { IOrderService, OrderData, OrderResult } from '../../domain/ports';

export class OrderService implements IOrderService {
  async processOrder(orderData: OrderData): Promise<OrderResult> {
    try {
      console.log('🔄 OrderService - Processing order...', { orderId: orderData.orderId });

      // Validation métier
      if (!this.validateOrder(orderData)) {
        throw new Error('Invalid order data');
      }

      // Simulation du traitement de commande (sauvegarde en DB, etc.)
      await this.simulateOrderProcessing(orderData);

      const result: OrderResult = {
        orderId: orderData.orderId,
        success: true,
        status: 'completed',
        processedAt: new Date().toISOString()
      };

      console.log('✅ OrderService - Order processed successfully', { orderId: orderData.orderId });
      return result;

    } catch (error) {
      console.error('❌ OrderService - Error processing order:', error);
      
      const result: OrderResult = {
        orderId: orderData.orderId,
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      return result;
    }
  }

  private async simulateOrderProcessing(orderData: OrderData): Promise<void> {
    // Simulation d'un traitement asynchrone (sauvegarde en DB, etc.)
    console.log('💾 OrderService - Saving order to database...', { orderId: orderData.orderId });
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler un échec aléatoire (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error('Database connection failed');
    }
    
    console.log('💾 OrderService - Order saved successfully');
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