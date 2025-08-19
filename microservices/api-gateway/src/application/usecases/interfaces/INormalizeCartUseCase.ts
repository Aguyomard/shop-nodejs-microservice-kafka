import { Cart, CartItem } from '../../../domain/ports';

export interface INormalizeCartUseCase {
  execute(cart: Cart | CartItem[]): CartItem[];
} 