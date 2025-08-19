import { Cart, CartItem, OrderResponse } from '../index';

export interface ICreateOrderSaga {
  execute(cart: Cart | CartItem[], userId: string): Promise<OrderResponse>;
} 