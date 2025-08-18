import { IEventBus, IOrderService, Cart, CartItem, OrderData, OrderResponse, PaymentData, EmailData } from '../types';

export class OrderService implements IOrderService {
  constructor(private eventBus: IEventBus) {}

  async createOrder(cart: Cart | CartItem[], userId: string): Promise<OrderResponse> {
    try {
      console.log('🔄 OrderService - Processing order creation...');
      
      // Validation métier
      this.validateOrder(cart, userId);
      
      // Génération de l'ID de commande
      const orderId = this.generateOrderId();
      
      // Logique métier : calcul du total
      const total = this.calculateTotal(cart);
      
      // Normalisation du format du cart
      const normalizedCart = this.normalizeCart(cart);
      
      // Préparation des données de commande
      const orderData: OrderData = {
        orderId,
        cart: normalizedCart,
        userId,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('📦 OrderService - Order data prepared:', { orderId, total });

      // Publication des événements (Saga Pattern)
      await this.publishOrderEvents(orderData);

      console.log('✅ OrderService - Order creation initiated successfully');

      return {
        orderId,
        status: 'processing',
        message: 'Order creation initiated',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ OrderService - Error creating order:', error);
      throw error;
    }
  }

  private validateOrder(cart: Cart | CartItem[], userId: string): void {
    // Vérifier si cart est un tableau d'items ou un objet avec propriété items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    
    if (!items || items.length === 0) {
      throw new Error('Cart cannot be empty');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (this.calculateTotal(cart) <= 0) {
      throw new Error('Order total must be greater than 0');
    }

    console.log('✅ OrderService - Order validation passed');
  }

  private calculateTotal(cart: Cart | CartItem[]): number {
    // Gérer les deux formats : tableau direct ou objet avec items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    
    return items.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  }

  private normalizeCart(cart: Cart | CartItem[]): Cart {
    // Normaliser le format pour les microservices
    if (Array.isArray(cart)) {
      return { items: cart };
    }
    return cart;
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
  }

  private async publishOrderEvents(orderData: OrderData): Promise<void> {
    // Saga Pattern : Publier les événements dans l'ordre
    const events = [
      {
        type: 'order.created' as const,
        data: orderData
      },
      {
        type: 'payment.requested' as const,
        data: {
          orderId: orderData.orderId,
          cart: orderData.cart,
          userId: orderData.userId,
          total: orderData.total
        } as PaymentData
      },
      {
        type: 'email.requested' as const,
        data: {
          orderId: orderData.orderId,
          userId: orderData.userId,
          email: 'test@test.com', // TODO: Get from user service
          type: 'order_confirmation'
        } as EmailData
      }
    ];

    // Publier les événements séquentiellement
    for (const event of events) {
      await this.eventBus.publish(event.type, event.data);
      console.log(`📤 OrderService - Published ${event.type}`);
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderResponse> {
    // TODO: Implémenter la récupération du statut
    return {
      orderId,
      status: 'processing',
      message: 'Order status retrieved',
      timestamp: new Date().toISOString()
    };
  }
} 