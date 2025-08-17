const { Kafka } = require('kafkajs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-service-group' });

app.use(express.json());

// Endpoint de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});

// Consommer les messages de commande
const consumeOrderMessages = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'orders', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const orderData = JSON.parse(message.value.toString());
        console.log('📦 Order Service - Processing order:', orderData);
        
        // Simulation du traitement de commande
        console.log('📦 Order Service - Order created successfully!');
        
        // Envoyer un message de confirmation
        await producer.connect();
        await producer.send({
          topic: 'analytics',
          messages: [
            { 
              value: JSON.stringify({
                type: 'order_created',
                data: orderData,
                timestamp: new Date().toISOString()
              })
            }
          ]
        });
        await producer.disconnect();
      }
    });

    console.log('📦 Order Service - Consumer started');
  } catch (error) {
    console.error('❌ Order Service - Error starting consumer:', error);
  }
};

// Démarrer le service
const startService = async () => {
  try {
    await consumeOrderMessages();
    
    app.listen(PORT, () => {
      console.log(`📦 Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Order Service - Failed to start:', error);
    process.exit(1);
  }
};

startService(); 