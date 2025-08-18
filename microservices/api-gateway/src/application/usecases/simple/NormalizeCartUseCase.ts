import { Cart, CartItem } from '../../../domain/ports';

export class NormalizeCartUseCase {
  execute(cart: Cart | CartItem[]): Cart {
    // Normaliser le format pour les microservices
    if (Array.isArray(cart)) {
      return { items: cart };
    }
    return cart;
  }
} 