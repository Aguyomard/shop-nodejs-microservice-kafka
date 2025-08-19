import { Cart, CartItem } from '../../../domain/ports';
import { INormalizeCartUseCase } from '../interfaces/INormalizeCartUseCase';

export class NormalizeCartUseCase implements INormalizeCartUseCase {
  execute(cart: Cart | CartItem[]): CartItem[] {
    // Normaliser le format : toujours retourner un tableau d'items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    console.log('✅ NormalizeCartUseCase - Cart normalized:', items.length, 'items');
    return items;
  }
} 