import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';
import { OrderConsumer } from './infrastructure/adapters/OrderConsumer';

// Application (Use Cases)
import { OrderService } from './application/services/OrderService';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialisation des services
const eventBus = new EventBus();
const orderService = new OrderService(eventBus);
const orderConsumer = new OrderConsumer(orderService);

// Endpoint de santé
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Order Service is running',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    version: '1.0.0'
  });
});

// Endpoint de test
app.post('/test-order', async (_req, res) => {
  try {
    const testOrderData = {
      orderId: 'test-order-123',
      cart: {
        items: [
          { id: 1, name: 'Test Product', price: 100 }
        ]
      },
      userId: 'test-user-123',
      total: 100,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    const result = await orderService.processOrder(testOrderData);
    
    res.json({
      success: true,
      data: result,
      message: 'Test order processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test order endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test order failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion de l'arrêt propre
let server: any;

const gracefulShutdown = async () => {
  console.log('🛑 Order Service - Shutting down gracefully...');
  
  try {
    // Arrêter le serveur HTTP
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    await orderConsumer.disconnect();
    await eventBus.disconnect();
    console.log('✅ Order Service - Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Order Service - Error during shutdown:', error);
    process.exit(1);
  }
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Démarrer le service
const startService = async () => {
  try {
    // Démarrer le consumer Kafka
    await orderConsumer.startConsuming();

    // Démarrer le serveur HTTP
    server = app.listen(PORT, () => {
      console.log(`🚀 Order Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start Order Service:', error);
    process.exit(1);
  }
};

startService(); 