import { Cart, CartItem } from '../../../domain/ports';

export class CalculateTotalUseCase {
  execute(cart: Cart | CartItem[]): number {
    // Gérer les deux formats : tableau direct ou objet avec items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    
    const total = items.reduce((sum: number, item: CartItem) => {
      return sum + (item.price || 0);
    }, 0);

    if (total <= 0) {
      throw new Error('Order total must be greater than 0');
    }

    console.log('✅ CalculateTotalUseCase - Total calculated:', total);
    return total;
  }
} 