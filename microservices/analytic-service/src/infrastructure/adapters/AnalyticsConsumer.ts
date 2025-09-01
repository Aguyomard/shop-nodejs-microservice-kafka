import { Kafka, Consumer } from 'kafkajs';
import { IAnalyticsService, IEventBus } from '../../domain/ports';

export class AnalyticsConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(
    private analyticsService: IAnalyticsService,
    private eventBus: IEventBus
  ) {
    this.kafka = new Kafka({
      clientId: 'analytic-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'analytic-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      // 🔄 NOUVEAU : Écouter les COMMANDS (ce qu'on veut faire)
      await this.consumer.subscribe({ topic: 'analytics-commands', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 AnalyticsConsumer connected to analytics-commands topic');
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
          console.log('📥 AnalyticsConsumer - Received command from analytics-commands topic:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString()
          });

          if (!message.value) {
            console.log('⚠️ AnalyticsConsumer - Empty message received');
            return;
          }

          const commandMessage = JSON.parse(message.value.toString());
          console.log('🔄 AnalyticsConsumer - Processing analytics command:', commandMessage.eventType);
          
          // 🔄 NOUVEAU : Traiter les COMMANDS et publier les EVENTS
          switch (commandMessage.eventType) {
            case 'analytics.collect':
              await this.handleAnalyticsCollect(commandMessage.data);
              break;
            case 'analytics.export':
              await this.handleAnalyticsExport(commandMessage.data);
              break;
            default:
              console.log('⚠️ AnalyticsConsumer - Unknown command:', commandMessage.eventType);
          }

        } catch (error) {
          console.error('❌ AnalyticsConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const commandMessage = JSON.parse(message.value?.toString() || '{}');
            if (commandMessage.eventType === 'analytics.collect') {
              await this.eventBus.publish('analytics.collection.failed', {
                data: commandMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ AnalyticsConsumer - Published analytics.collection.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ AnalyticsConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 AnalyticsConsumer - Started consuming commands from analytics-commands topic');
  }

  // 🔄 NOUVELLES MÉTHODES : Gestion des différentes commands
  private async handleAnalyticsCollect(analyticsData: any): Promise<void> {
    try {
      console.log('🔄 AnalyticsConsumer - Processing analytics.collect command:', analyticsData);

      // Traiter l'événement d'analytics
      const result = await this.analyticsService.processEvent(analyticsData);
      
      // Publier l'EVENT de résultat
      if (result.success) {
        await this.eventBus.publish('analytics.collected', {
          eventId: result.eventId,
          data: analyticsData,
          timestamp: new Date().toISOString()
        });
        console.log('✅ AnalyticsConsumer - Published analytics.collected EVENT');
      } else {
        await this.eventBus.publish('analytics.collection.failed', {
          data: analyticsData,
          error: result.error
        });
        console.log('❌ AnalyticsConsumer - Published analytics.collection.failed EVENT');
      }
    } catch (error) {
      console.error('❌ AnalyticsConsumer - Error handling analytics.collect:', error);
      await this.eventBus.publish('analytics.collection.failed', {
        data: analyticsData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleAnalyticsExport(analyticsData: any): Promise<void> {
    try {
      console.log('🔄 AnalyticsConsumer - Processing analytics.export command:', analyticsData);
      
      // Logique d'export des analytics
      await this.eventBus.publish('analytics.exported', {
        data: analyticsData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ AnalyticsConsumer - Published analytics.exported EVENT');
    } catch (error) {
      console.error('❌ AnalyticsConsumer - Error handling analytics.export:', error);
    }
  }
} 