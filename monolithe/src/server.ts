import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import { createOrder, pay, sendEmail, logAnalytics } from './config/db.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
          "'unsafe-eval'", // Nécessaire pour GraphiQL
          'https://unpkg.com', // Autoriser GraphiQL à charger ses scripts
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Nécessaire pour le CSS inline de GraphiQL
          'https://unpkg.com', // Autoriser GraphiQL à charger son CSS
        ],
        imgSrc: [
          "'self'",
          'data:', // Autoriser les images en base64
          'https://raw.githubusercontent.com', // Autoriser l'icône de GraphiQL
        ],
      },
    },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/test', async (req, res) => {
  try {
    const cart = { items: [{ id: 1, name: 'Test Product', price: 10 }] };
    const userId = 'test-user-123';

    console.log('🔄 Creating order...');
    const orderId = await createOrder(cart, userId);
    console.log('✅ Order created with ID:', orderId);

    res.json({
      result: 200,
      message: 'Order created successfully ++!!!',
      orderId: orderId,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      result: 500,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Nouvel endpoint pour créer une commande complète
app.post('/order', async (req, res) => {
  try {
    const { cart } = req.body;
    const userId = req.body.userId || 'test-user-123'; // Fallback pour les tests

    console.log('🔄 Processing order...');
    console.log(' Cart:', cart);
    console.log('👤 User ID:', userId);

    // Processus complet de commande
    const paymentResult = await pay(cart, userId);
    console.log('💳 Payment result:', paymentResult);

    await logAnalytics({ cart, userId }, 'Payment successful');
    console.log('📊 Analytics logged: Payment successful');

    const orderId = await createOrder(cart, userId);
    console.log('✅ Order created with ID:', orderId);

    await logAnalytics({ orderId, userId }, 'Order created');
    console.log('📊 Analytics logged: Order created');

    const emailResult = await sendEmail(orderId, userId, 'test@test.com');
    console.log('📧 Email result:', emailResult);

    await logAnalytics({ orderId, userId, emailResult }, 'Email sent');
    console.log('📊 Analytics logged: Email sent');

    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    return res.json({
      orderId,
      paymentResult,
      emailResult,
      timestamp,
      message: 'Order processed successfully!',
    });
  } catch (error) {
    console.error('❌ Error processing order:', error);

    const errorTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    return res.status(500).json({
      error: 'Failed to process order',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: errorTimestamp,
    });
  }
});

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Échec du démarrage du serveur :', error);
    process.exit(1);
  }
};

startServer();
