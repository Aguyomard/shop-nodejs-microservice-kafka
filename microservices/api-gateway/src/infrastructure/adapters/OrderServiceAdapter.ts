import { IOrderService, Cart, CartItem, OrderResponse } from '../../domain/ports';
import { ICreateOrderSaga } from '../../application/usecases/interfaces/ICreateOrderSaga';

export class OrderServiceAdapter implements IOrderService {
  constructor(private createOrderSaga: ICreateOrderSaga) {}

  async createOrder(cart: Cart | CartItem[], userId: string): Promise<OrderResponse> {
    return this.createOrderSaga.execute(cart, userId);
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