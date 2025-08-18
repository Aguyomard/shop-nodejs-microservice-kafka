import { IEventBus, Cart, CartItem, OrderData, OrderResponse, PaymentData, EmailData } from '../../../domain/ports';
import { ValidateCartUseCase } from '../simple/ValidateCartUseCase';
import { CalculateTotalUseCase } from '../simple/CalculateTotalUseCase';
import { GenerateOrderIdUseCase } from '../simple/GenerateOrderIdUseCase';
import { NormalizeCartUseCase } from '../simple/NormalizeCartUseCase';

export class CreateOrderSaga {
  constructor(
    private validateCartUseCase: ValidateCartUseCase,
    private calculateTotalUseCase: CalculateTotalUseCase,
    private generateOrderIdUseCase: GenerateOrderIdUseCase,
    private normalizeCartUseCase: NormalizeCartUseCase,
    private eventBus: IEventBus
  ) {}

  async execute(cart: Cart | CartItem[], userId: string): Promise<OrderResponse> {
    try {
      console.log('🔄 CreateOrderSaga - Starting order creation saga...');
      
      // 1. Validation métier
      this.validateCartUseCase.execute(cart, userId);
      
      // 2. Calcul du total
      const total = this.calculateTotalUseCase.execute(cart);
      
      // 3. Génération de l'ID de commande
      const orderId = this.generateOrderIdUseCase.execute();
      
      // 4. Normalisation du format du cart
      const normalizedCart = this.normalizeCartUseCase.execute(cart);
      
      // 5. Préparation des données de commande
      const orderData: OrderData = {
        orderId,
        cart: normalizedCart,
        userId,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('📦 CreateOrderSaga - Order data prepared:', { orderId, total });

      // 6. Publication des événements (Saga Pattern)
      await this.publishOrderEvents(orderData);

      console.log('✅ CreateOrderSaga - Order creation saga completed successfully');

      return {
        orderId,
        status: 'processing',
        message: 'Order creation initiated',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ CreateOrderSaga - Error in order creation saga:', error);
      throw error;
    }
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
      console.log(`📤 CreateOrderSaga - Published ${event.type}`);
    }
  }
} 