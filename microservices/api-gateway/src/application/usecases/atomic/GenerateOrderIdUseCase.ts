import { IGenerateOrderIdUseCase } from '../interfaces/IGenerateOrderIdUseCase';

export class GenerateOrderIdUseCase implements IGenerateOrderIdUseCase {
  execute(): string {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('✅ GenerateOrderIdUseCase - Order ID generated:', orderId);
    return orderId;
  }
} 