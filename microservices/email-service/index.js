const { Kafka } = require('kafkajs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3003;

// Configuration Kafka
const kafka = new Kafka({
  clientId: 'email-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'email-service-group' });

app.use(express.json());

// Endpoint de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'email-service' });
});

// Consommer les messages d'email
const consumeEmailMessages = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'emails', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const emailData = JSON.parse(message.value.toString());
        console.log('📧 Email Service - Processing email:', emailData);
        
        // Simulation de l'envoi d'email
        console.log('📧 Email Service - Email sent successfully!');
        
        // Envoyer un message de confirmation
        await producer.connect();
        await producer.send({
          topic: 'analytics',
          messages: [
            { 
              value: JSON.stringify({
                type: 'email_sent',
                data: emailData,
                timestamp: new Date().toISOString()
              })
            }
          ]
        });
        await producer.disconnect();
      }
    });

    console.log('📧 Email Service - Consumer started');
  } catch (error) {
    console.error('❌ Email Service - Error starting consumer:', error);
  }
};

// Démarrer le service
const startService = async () => {
  try {
    await consumeEmailMessages();
    
    app.listen(PORT, () => {
      console.log(`📧 Email Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Email Service - Failed to start:', error);
    process.exit(1);
  }
};

startService(); 