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
      // Topics pour Commands (ce qu'on veut faire)
      { topic: 'orders-commands', numPartitions: 3, replicationFactor: 1 },
      { topic: 'payments-commands', numPartitions: 3, replicationFactor: 1 },
      { topic: 'emails-commands', numPartitions: 3, replicationFactor: 1 },
      { topic: 'analytics-commands', numPartitions: 3, replicationFactor: 1 },
      
      // Topics pour Events (ce qui s'est passé)
      { topic: 'orders-events', numPartitions: 3, replicationFactor: 1 },
      { topic: 'payments-events', numPartitions: 3, replicationFactor: 1 },
      { topic: 'emails-events', numPartitions: 3, replicationFactor: 1 },
      { topic: 'analytics-events', numPartitions: 3, replicationFactor: 1 },
      
      // Topic cross-domain
      { topic: 'business-events', numPartitions: 3, replicationFactor: 1 }
    ];

    await admin.createTopics({
      topics,
      waitForLeaders: true,
    });

    console.log('✅ Topics created successfully');
    console.log('📋 New architecture: Commands vs Events separation');
    
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