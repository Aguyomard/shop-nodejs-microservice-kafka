import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';
import { PaymentConsumer } from './infrastructure/adapters/PaymentConsumer';

// Application (Use Cases)
import { PaymentService } from './application/services/PaymentService';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3002;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialisation des services
const eventBus = new EventBus();
const paymentService = new PaymentService(eventBus);
const paymentConsumer = new PaymentConsumer(paymentService);

// Endpoint de santé
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Payment Service is running',
    timestamp: new Date().toISOString(),
    service: 'payment-service',
    version: '1.0.0'
  });
});

// Endpoint de test
app.post('/test-payment', async (_req, res) => {
  try {
    const testPaymentData = {
      orderId: 'test-order-123',
      cart: {
        items: [
          { id: 1, name: 'Test Product', price: 100 }
        ]
      },
      userId: 'test-user-123',
      total: 100
    };

    const result = await paymentService.processPayment(testPaymentData);
    
    res.json({
      success: true,
      data: result,
      message: 'Test payment processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test payment endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test payment failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion de l'arrêt propre
let server: any;

const gracefulShutdown = async () => {
  console.log('🛑 Payment Service - Shutting down gracefully...');
  
  try {
    // Arrêter le serveur HTTP
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    await paymentConsumer.disconnect();
    await eventBus.disconnect();
    console.log('✅ Payment Service - Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Payment Service - Error during shutdown:', error);
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
    await paymentConsumer.startConsuming();

    // Démarrer le serveur HTTP
    server = app.listen(PORT, () => {
      console.log(`🚀 Payment Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start Payment Service:', error);
    process.exit(1);
  }
};

startService(); 