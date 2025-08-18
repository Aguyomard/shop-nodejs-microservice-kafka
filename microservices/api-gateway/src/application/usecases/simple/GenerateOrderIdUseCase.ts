export class GenerateOrderIdUseCase {
  execute(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const orderId = `order_${timestamp}_${random}`;
    
    console.log('✅ GenerateOrderIdUseCase - Order ID generated:', orderId);
    return orderId;
  }
} 