const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'kafka-admin',
  brokers: ['localhost:9092']
});

const admin = kafka.admin();

const createTopics = async () => {
  try {
    await admin.connect();
    console.log('🔌 Connected to Kafka');

    const topics = [
      { topic: 'orders', numPartitions: 3, replicationFactor: 1 },
      { topic: 'payments', numPartitions: 3, replicationFactor: 1 },
      { topic: 'emails', numPartitions: 3, replicationFactor: 1 },
      { topic: 'analytics', numPartitions: 3, replicationFactor: 1 }
    ];

    await admin.createTopics({
      topics,
      waitForLeaders: true,
    });

    console.log('✅ Topics created successfully');
    
    const existingTopics = await admin.listTopics();
    console.log('📋 Existing topics:', existingTopics);

  } catch (error) {
    console.error('❌ Error creating topics:', error);
  } finally {
    await admin.disconnect();
    console.log('🔌 Disconnected from Kafka');
  }
};

// Créer les topics au démarrage
createTopics();

// Garder le processus en vie pour les tests
setInterval(() => {
  console.log('🔄 Kafka admin service running...');
}, 30000); 