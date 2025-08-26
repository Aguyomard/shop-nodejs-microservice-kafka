import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';
import { AnalyticsConsumer } from './infrastructure/adapters/AnalyticsConsumer';

// Application (Use Cases)
import { AnalyticsService } from './application/services/AnalyticsService';

// Infrastructure (Controllers)
import { AnalyticsController } from './infrastructure/controllers/AnalyticsController';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3006;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialisation des services
const eventBus = new EventBus();
const analyticsService = new AnalyticsService(eventBus);
const analyticsConsumer = new AnalyticsConsumer(analyticsService, eventBus);
const analyticsController = new AnalyticsController(analyticsService);

// Endpoint de santé
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Analytics Service is running',
    timestamp: new Date().toISOString(),
    service: 'analytic-service',
    version: '1.0.0'
  });
});

// Routes Analytics
app.get('/analytics/orders', (req, res) => analyticsController.getAllOrderMetrics(req, res));
app.get('/analytics/orders/:orderId', (req, res) => analyticsController.getOrderMetrics(req, res));
app.get('/analytics/orders/stats/summary', (req, res) => analyticsController.getOrderStatsSummary(req, res));

// Endpoint de test
app.post('/test-analytics', async (_req, res) => {
  try {
    const testAnalyticsData = {
      eventType: 'order.created',
      orderId: 'test-order-123',
      userId: 'test-user-123',
      data: { 
        total: 99.99,
        cart: [
          { id: 'item1', name: 'Test Item', price: 49.99 },
          { id: 'item2', name: 'Test Item 2', price: 50.00 }
        ]
      },
      timestamp: new Date().toISOString()
    };

    const result = await analyticsService.processEvent(testAnalyticsData);
    
    res.json({
      success: true,
      data: result,
      message: 'Test order analytics processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test analytics endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test analytics failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion de l'arrêt propre
let server: any;

const gracefulShutdown = async () => {
  console.log('🛑 Analytics Service - Shutting down gracefully...');
  
  try {
    // Arrêter le serveur HTTP
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    await analyticsConsumer.disconnect();
    await eventBus.disconnect();
    console.log('✅ Analytics Service - Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Analytics Service - Error during shutdown:', error);
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
    await analyticsConsumer.startConsuming();

    // Démarrer le serveur HTTP
    server = app.listen(PORT, () => {
      console.log(`🚀 Analytics Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start Analytics Service:', error);
    process.exit(1);
  }
};

startService(); 