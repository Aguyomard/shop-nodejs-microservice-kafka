import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';
import { EmailConsumer } from './infrastructure/adapters/EmailConsumer';

// Application (Use Cases)
import { EmailService } from './application/services/EmailService';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3004;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Initialisation des services
const eventBus = new EventBus();
const emailService = new EmailService(eventBus);
const emailConsumer = new EmailConsumer(emailService);

// Endpoint de santé
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Email Service is running',
    timestamp: new Date().toISOString(),
    service: 'email-service',
    version: '1.0.0'
  });
});

// Endpoint de test
app.post('/test-email', async (_req, res) => {
  try {
    const testEmailData = {
      orderId: 'test-order-123',
      userId: 'test-user-123',
      email: 'test@example.com',
      type: 'order_confirmation' as const
    };

    const result = await emailService.sendEmail(testEmailData);
    
    res.json({
      success: true,
      data: result,
      message: 'Test email sent',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion de l'arrêt propre
let server: any;

const gracefulShutdown = async () => {
  console.log('🛑 Email Service - Shutting down gracefully...');
  
  try {
    // Arrêter le serveur HTTP
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    await emailConsumer.disconnect();
    await eventBus.disconnect();
    console.log('✅ Email Service - Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Email Service - Error during shutdown:', error);
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
    await emailConsumer.startConsuming();

    // Démarrer le serveur HTTP
    server = app.listen(PORT, () => {
      console.log(`🚀 Email Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start Email Service:', error);
    process.exit(1);
  }
};

startService(); 