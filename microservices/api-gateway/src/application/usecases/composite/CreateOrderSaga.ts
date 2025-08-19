import { IEventBus, Cart, CartItem, OrderData, OrderResponse } from '../../../domain/ports';
import { ValidateCartUseCase } from '../simple/ValidateCartUseCase';
import { CalculateTotalUseCase } from '../simple/CalculateTotalUseCase';
import { GenerateOrderIdUseCase } from '../simple/GenerateOrderIdUseCase';
import { NormalizeCartUseCase } from '../simple/NormalizeCartUseCase';
import { OrderSagaOrchestrator } from './OrderSagaOrchestrator';

export class CreateOrderSaga {
  private orchestrator: OrderSagaOrchestrator;

  constructor(
    private validateCartUseCase: ValidateCartUseCase,
    private calculateTotalUseCase: CalculateTotalUseCase,
    private generateOrderIdUseCase: GenerateOrderIdUseCase,
    private normalizeCartUseCase: NormalizeCartUseCase,
    eventBus: IEventBus
  ) {
    this.orchestrator = new OrderSagaOrchestrator(eventBus);
  }

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

      // 6. Démarrer l'orchestration de la Saga
      await this.orchestrator.startOrderSaga(orderData);

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