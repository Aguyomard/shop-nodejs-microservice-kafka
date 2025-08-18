const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Services
const EventBus = require('./services/EventBus');
const OrderService = require('./services/OrderService');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// Initialisation des services
const eventBus = new EventBus();
const orderService = new OrderService(eventBus);

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

// Endpoint de test
app.get('/test', async (req, res) => {
  try {
    const cart = { items: [{ id: 1, name: 'Test Product', price: 10 }] };
    const userId = 'test-user-123';

    console.log('🔄 API Gateway - Processing test order...');
    
    // ✅ Utiliser le service métier pour le test
    const result = await orderService.createOrder(cart, userId);

    res.json({
      result: 200,
      message: 'Test order processed via service layer!',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Gateway - Error processing test:', error);
    res.status(500).json({
      result: 500,
      error: 'Failed to process test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Endpoint principal pour créer une commande
app.post('/order', async (req, res) => {
  try {
    const { cart } = req.body;
    const userId = req.body.userId || 'test-user-123';

    console.log('🔄 API Gateway - Processing order request...');
    console.log(' Cart details:', cart);
    console.log('👤 User ID:', userId);

    // ✅ Délégation au service métier
    const result = await orderService.createOrder(cart, userId);

    console.log('✅ API Gateway - Order processed successfully');

    return res.json(result);
  } catch (error) {
    console.error('❌ API Gateway - Error processing order:', error);

    const errorTimestamp = new Date().toISOString();

    return res.status(500).json({
      error: 'Failed to process order',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: errorTimestamp,
    });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer(); 