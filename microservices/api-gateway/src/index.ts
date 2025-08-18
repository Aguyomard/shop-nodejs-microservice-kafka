import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Infrastructure (Adapters)
import { EventBus } from './infrastructure/adapters/EventBus';

// Application (Use Cases)
import { OrderService } from './application/services/OrderService';

// Controllers (Adapters)
import { OrderController } from './infrastructure/controllers/OrderController';

const app: Application = express();
const PORT: number = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3005;

// Initialisation des services
const eventBus = new EventBus();
const orderService = new OrderService(eventBus);
const orderController = new OrderController(orderService);

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

const startServer = async (): Promise<void> => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
      console.log('📦 Architecture: Hexagonal with TypeScript and Kafka with restart');
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer(); 