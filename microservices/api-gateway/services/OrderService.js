class OrderService {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  async createOrder(cart, userId) {
    try {
      console.log('🔄 OrderService - Processing order creation...');
      
      // Validation métier
      this.validateOrder(cart, userId);
      
      // Génération de l'ID de commande
      const orderId = this.generateOrderId();
      
      // Logique métier : calcul du total
      const total = this.calculateTotal(cart);
      
      // Préparation des données de commande
      const orderData = {
        orderId,
        cart: Array.isArray(cart) ? { items: cart } : cart, // Normaliser le format
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

  validateOrder(cart, userId) {
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

  calculateTotal(cart) {
    // Gérer les deux formats : tableau direct ou objet avec items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    
    return items.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  }

  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
  }

  async publishOrderEvents(orderData) {
    // Saga Pattern : Publier les événements dans l'ordre
    const events = [
      {
        type: 'order.created',
        data: orderData
      },
      {
        type: 'payment.requested',
        data: {
          orderId: orderData.orderId,
          cart: orderData.cart,
          userId: orderData.userId,
          total: orderData.total
        }
      },
      {
        type: 'email.requested',
        data: {
          orderId: orderData.orderId,
          userId: orderData.userId,
          email: 'test@test.com', // TODO: Get from user service
          type: 'order_confirmation'
        }
      }
    ];

    // Publier les événements séquentiellement
    for (const event of events) {
      await this.eventBus.publish(event.type, event.data);
      console.log(`📤 OrderService - Published ${event.type}`);
    }
  }

  async getOrderStatus(orderId) {
    // TODO: Implémenter la récupération du statut
    return {
      orderId,
      status: 'processing',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = OrderService; 