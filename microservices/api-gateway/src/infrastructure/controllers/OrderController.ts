import { Request, Response } from 'express';
import { IOrderService, Cart, CartItem, ApiResponse, OrderResponse } from '../../types';

export class OrderController {
  constructor(private orderService: IOrderService) {}

  // Endpoint de test
  async testOrder(_req: Request, res: Response): Promise<void> {
    try {
      const cart: Cart = { items: [{ id: 1, name: 'Test Product', price: 10 }] };
      const userId = 'test-user-123';

      console.log('🔄 OrderController - Processing test order...');
      
      // ✅ Délégation au service métier
      const result = await this.orderService.createOrder(cart, userId);

      const response: ApiResponse<OrderResponse> = {
        success: true,
        data: result,
        message: 'Test order processed via service layer!',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('❌ OrderController - Error processing test:', error);
      
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Failed to process test',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }

  // Endpoint principal pour créer une commande
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { cart } = req.body as { cart: Cart | CartItem[] };
      const userId = (req.body as any).userId || 'test-user-123';

      console.log('🔄 OrderController - Processing order request...');
      console.log(' Cart details with controller:', cart);
      console.log('👤 User ID:', userId);

      // ✅ Délégation au service métier
      const result = await this.orderService.createOrder(cart, userId);

      console.log('✅ OrderController - Order processed successfully');

      const response: ApiResponse<OrderResponse> = {
        success: true,
        data: result,
        message: 'Order created successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('❌ OrderController - Error processing order:', error);

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }

  // Endpoint de santé
  health(_req: Request, res: Response): void {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'OK',
        service: 'api-gateway',
        controller: 'OrderController'
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }
} 