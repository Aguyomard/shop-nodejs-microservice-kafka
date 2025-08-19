import { Cart, CartItem, OrderData, OrderResponse, ICreateOrderSaga } from '../../../domain/ports';
import { 
  IValidateCartUseCase,
  ICalculateTotalUseCase,
  IGenerateOrderIdUseCase,
  INormalizeCartUseCase,
  IOrderSagaOrchestrator
} from '../interfaces';

export class CreateOrderSaga implements ICreateOrderSaga {
  constructor(
    private validateCartUseCase: IValidateCartUseCase,
    private calculateTotalUseCase: ICalculateTotalUseCase,
    private generateOrderIdUseCase: IGenerateOrderIdUseCase,
    private normalizeCartUseCase: INormalizeCartUseCase,
    private orderSagaOrchestrator: IOrderSagaOrchestrator
  ) {}

  async execute(cart: Cart | CartItem[], userId: string): Promise<OrderResponse> {
    try {
      console.log('🔄 CreateOrderSaga - Starting order creation saga...');
      
      // 1. Validation métier
      this.validateCartUseCase.execute(cart, userId);
      
      // 2. Normalisation du format du cart (en premier pour éviter la duplication)
      const normalizedCartItems = this.normalizeCartUseCase.execute(cart);
      
      // 3. Calcul du total avec le cart normalisé
      const total = this.calculateTotalUseCase.execute(normalizedCartItems);
      
      // 4. Génération de l'ID de commande
      const orderId = this.generateOrderIdUseCase.execute();
      
      // 5. Préparation des données de commande
      const orderData: OrderData = {
        orderId,
        cart: { items: normalizedCartItems }, // Convertir en format Cart
        userId,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('📦 CreateOrderSaga - Order data prepared:', { orderId, total });

      // 6. Démarrer l'orchestration de la Saga
      await this.orderSagaOrchestrator.startOrderSaga(orderData);

      console.log('✅ CreateOrderSaga - Order creation saga initiated successfully');

      return {
        orderId,
        status: 'processing',
        message: 'Order creation initiated',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ CreateOrderSaga - Error creating order:', error);
      throw error;
    }
  }
} 