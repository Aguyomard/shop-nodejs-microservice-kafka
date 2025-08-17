const { Kafka } = require('kafkajs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3004;

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'analytic-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'analytic-service-group' });

app.use(express.json());

// Endpoint de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'analytic-service' });
});

// Consommer tous les messages d'analytics
const consumeAnalyticsMessages = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'analytics', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const analyticsData = JSON.parse(message.value.toString());
        console.log('📊 Analytics Service - Processing analytics:', analyticsData);
        
        // Simulation du traitement des analytics
        console.log('📊 Analytics Service - Analytics logged successfully!');
      }
    });

    console.log('📊 Analytics Service - Consumer started');
  } catch (error) {
    console.error('❌ Analytics Service - Error starting consumer:', error);
  }
};

// Démarrer le service
const startService = async () => {
  try {
    await consumeAnalyticsMessages();
    
    app.listen(PORT, () => {
      console.log(`📊 Analytics Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Analytics Service - Failed to start:', error);
    process.exit(1);
  }
};

startService(); 