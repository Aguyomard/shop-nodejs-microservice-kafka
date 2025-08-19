import { Cart, CartItem, OrderResponse } from '../../../domain/ports';

export interface ICreateOrderSaga {
  execute(cart: Cart | CartItem[], userId: string): Promise<OrderResponse>;
} 