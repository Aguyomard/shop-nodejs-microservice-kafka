const { Kafka } = require('kafkajs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'payment-service-group' });

app.use(express.json());

// Endpoint de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

// Consommer les messages de paiement
const consumePaymentMessages = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'payments', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const paymentData = JSON.parse(message.value.toString());
        console.log('💳 Payment Service - Processing payment:', paymentData);
        
        // Simulation du traitement de paiement
        console.log('💳 Payment Service - Payment processed successfully!');
        
        // Envoyer un message de confirmation
        await producer.connect();
        await producer.send({
          topic: 'analytics',
          messages: [
            { 
              value: JSON.stringify({
                type: 'payment_success',
                data: paymentData,
                timestamp: new Date().toISOString()
              })
            }
          ]
        });
        await producer.disconnect();
      }
    });

    console.log('💳 Payment Service - Consumer started');
  } catch (error) {
    console.error('❌ Payment Service - Error starting consumer:', error);
  }
};

// Démarrer le service
const startService = async () => {
  try {
    await consumePaymentMessages();
    
    app.listen(PORT, () => {
      console.log(`💳 Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Payment Service - Failed to start:', error);
    process.exit(1);
  }
};

startService(); 