import { IOrderService, Cart, CartItem, OrderResponse, ICreateOrderSaga } from '../../domain/ports';

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