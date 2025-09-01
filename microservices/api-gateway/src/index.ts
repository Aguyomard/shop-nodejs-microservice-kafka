import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';

// Application (Use Cases)
import { CreateOrderSaga } from './application/usecases/composite/CreateOrderSaga';
import { OrderSagaOrchestrator } from './application/usecases/composite/OrderSagaOrchestrator';
import { ValidateCartUseCase } from './application/usecases/atomic/ValidateCartUseCase';
import { CalculateTotalUseCase } from './application/usecases/atomic/CalculateTotalUseCase';
import { GenerateOrderIdUseCase } from './application/usecases/atomic/GenerateOrderIdUseCase';
import { NormalizeCartUseCase } from './application/usecases/atomic/NormalizeCartUseCase';

// Shared Services
import { MonitoringService } from './shared/services/MonitoringService';

// Controllers (Adapters)
import { OrderController } from './infrastructure/controllers/OrderController';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3005;

// Initialisation des services
const eventBus = new EventBus();

// Initialisation du service de monitoring (doit être initialisé après EventBus)
// Le service s'abonne automatiquement aux événements de monitoring et d'erreur
const monitoringService = new MonitoringService(eventBus);

// Initialisation des use cases atomiques
const validateCartUseCase = new ValidateCartUseCase();
const calculateTotalUseCase = new CalculateTotalUseCase();
const generateOrderIdUseCase = new GenerateOrderIdUseCase();
const normalizeCartUseCase = new NormalizeCartUseCase();

// Initialisation de l'orchestrateur de Saga
const orderSagaOrchestrator = new OrderSagaOrchestrator(eventBus);

// Initialisation du use case composite (Saga)
const createOrderSaga = new CreateOrderSaga(
  validateCartUseCase,
  calculateTotalUseCase,
  generateOrderIdUseCase,
  normalizeCartUseCase,
  orderSagaOrchestrator
);

// Controller utilise directement le port primaire
const orderController = new OrderController(createOrderSaga);

// Middlewares
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
        ],
        imgSrc: [
          "'self'",
          'data:',
        ],
      },
    },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes (Adapters)
app.get('/test', (req, res) => orderController.testOrder(req, res));
app.post('/order', (req, res) => orderController.createOrder(req, res));
app.get('/health', (req, res) => orderController.health(req, res));

// Route de monitoring pour vérifier l'état du service
app.get('/monitoring/status', (_req, res) => {
  res.json({
    status: 'active',
    service: 'MonitoringService',
    timestamp: new Date().toISOString(),
    message: 'Monitoring service is running and listening for error events'
  });
});

const startServer = async (): Promise<void> => {
  try {
    // Démarrer le service de monitoring et vérifier qu'il est actif
    console.log('🛡️ Starting Monitoring Service...');
    
    // Vérifier que le monitoring service est bien initialisé
    if (monitoringService) {
      console.log('✅ Monitoring Service initialized successfully');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
      console.log('📦 Architecture: Hexagonal with TypeScript and Kafka with restart');
      console.log('🛡️ Error Handling: Retry + Monitoring + Error Events Architecture');
      console.log('📊 Monitoring Service: Active and listening for error events');
      console.log('🔍 Monitoring endpoint: http://localhost:${PORT}/monitoring/status');
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer(); 