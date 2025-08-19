import { Cart, CartItem } from '../../../domain/ports';
import { IValidateCartUseCase } from '../interfaces/IValidateCartUseCase';

export class ValidateCartUseCase implements IValidateCartUseCase {
  execute(cart: Cart | CartItem[], userId: string): void {
    // Vérifier si cart est un tableau d'items ou un objet avec propriété items
    const items = Array.isArray(cart) ? cart : (cart?.items || []);
    
    if (!items || items.length === 0) {
      throw new Error('Cart cannot be empty');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('✅ ValidateCartUseCase - Cart validation passed');
  }
} 