import { Cart, CartItem } from '../../../domain/ports';

export interface ICalculateTotalUseCase {
  execute(cart: Cart | CartItem[]): number;
} 