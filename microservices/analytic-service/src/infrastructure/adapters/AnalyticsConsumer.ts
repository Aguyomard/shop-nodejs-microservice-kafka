import { Kafka, Consumer } from 'kafkajs';
import { IAnalyticsService } from '../../domain/ports';

export class AnalyticsConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(private analyticsService: IAnalyticsService) {
    this.kafka = new Kafka({
      clientId: 'analytic-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'analytic-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'analytics', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 AnalyticsConsumer connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 AnalyticsConsumer disconnected from Kafka');
    }
  }

  async startConsuming(): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('📥 AnalyticsConsumer - Received message:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: message.value?.toString()
          });

          if (!message.value) {
            console.log('⚠️ AnalyticsConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 AnalyticsConsumer - Processing event message:', eventMessage);

          // Extraire les données d'analytics du wrapper EventMessage
          const analyticsData = eventMessage.data;
          
          // Ajouter l'eventType du wrapper aux données si pas déjà présent
          if (!analyticsData.eventType && eventMessage.eventType) {
            analyticsData.eventType = eventMessage.eventType;
          }
          
          // Ajouter le timestamp du wrapper si pas déjà présent
          if (!analyticsData.timestamp && eventMessage.timestamp) {
            analyticsData.timestamp = eventMessage.timestamp;
          }
          
          console.log('🔄 AnalyticsConsumer - Extracted analytics data:', analyticsData);

          // Traiter l'événement d'analytics
          const result = await this.analyticsService.processEvent(analyticsData);
          console.log('✅ AnalyticsConsumer - Analytics processing completed:', result);

        } catch (error) {
          console.error('❌ AnalyticsConsumer - Error processing message:', error);
        }
      }
    });

    console.log('🚀 AnalyticsConsumer - Started consuming messages from analytics topic');
  }
} 