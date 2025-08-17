const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Kafka } = require('kafkajs');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

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
    
    // Envoyer vers le service de paiement
    await producer.connect();
    await producer.send({
      topic: 'payments',
      messages: [{ value: JSON.stringify({ cart, userId }) }]
    });
    console.log('💳 API Gateway - Payment message sent to Kafka');

    // Envoyer vers le service de commande
    await producer.send({
      topic: 'orders',
      messages: [{ value: JSON.stringify({ cart, userId }) }]
    });
    console.log('📦 API Gateway - Order message sent to Kafka');

    // Envoyer vers le service d'email
    await producer.send({
      topic: 'emails',
      messages: [{ value: JSON.stringify({ cart, userId, email: 'test@test.com' }) }]
    });
    console.log('📧 API Gateway - Email message sent to Kafka');

    await producer.disconnect();

    res.json({
      result: 200,
      message: 'Test messages sent to microservices via Kafka!',
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

    console.log('🔄 API Gateway - Processing order...');
    console.log(' Cart:', cart);
    console.log('👤 User ID:', userId);

    await producer.connect();

    // Envoyer vers le service de paiement
    await producer.send({
      topic: 'payments',
      messages: [{ value: JSON.stringify({ cart, userId }) }]
    });
    console.log('💳 API Gateway - Payment message sent to Kafka');

    // Envoyer vers le service de commande
    await producer.send({
      topic: 'orders',
      messages: [{ value: JSON.stringify({ cart, userId }) }]
    });
    console.log('📦 API Gateway - Order message sent to Kafka');

    // Envoyer vers le service d'email
    await producer.send({
      topic: 'emails',
      messages: [{ value: JSON.stringify({ cart, userId, email: 'test@test.com' }) }]
    });
    console.log('📧 API Gateway - Email message sent to Kafka');

    await producer.disconnect();

    const timestamp = new Date().toISOString();

    return res.json({
      message: 'Order messages sent to microservices via Kafka!',
      timestamp,
      status: 'processing'
    });
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