import { Cart, CartItem } from '../../../domain/ports';

export interface IValidateCartUseCase {
  execute(cart: Cart | CartItem[], userId: string): void;
} 