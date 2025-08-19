import { Cart, CartItem, OrderResponse } from '../index';

export interface IOrderService {
  createOrder(cart: Cart | CartItem[], userId: string): Promise<OrderResponse>;
} 