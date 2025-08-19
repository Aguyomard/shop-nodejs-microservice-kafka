import { Kafka, Consumer } from 'kafkajs';
import { IEmailService, IEventBus } from '../../domain/ports';

export class EmailConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(
    private emailService: IEmailService,
    private eventBus: IEventBus
  ) {
    this.kafka = new Kafka({
      clientId: 'email-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'email-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'emails', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 EmailConsumer connected to Kafka');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 EmailConsumer disconnected from Kafka');
    }
  }

  async startConsuming(): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          console.log('📥 EmailConsumer - Received message from emails topic');

          if (!message.value) {
            console.log('⚠️ EmailConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 EmailConsumer - Processing event:', eventMessage.eventType);

          // Traiter seulement l'événement 'email.requested'
          if (eventMessage.eventType === 'email.requested') {
            const emailData = eventMessage.data;
            console.log('🔄 EmailConsumer - Processing email request:', emailData);

            // Traiter l'email
            const result = await this.emailService.sendEmail(emailData);
            
            // Publier le résultat selon le succès/échec
            if (result.success) {
              await this.eventBus.publish('email.sent.success', emailData);
              console.log('✅ EmailConsumer - Published email.sent.success');
            } else {
              await this.eventBus.publish('email.sent.failed', {
                emailData,
                error: result.error
              });
              console.log('❌ EmailConsumer - Published email.sent.failed');
            }
          }

        } catch (error) {
          console.error('❌ EmailConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const eventMessage = JSON.parse(message.value?.toString() || '{}');
            if (eventMessage.eventType === 'email.requested') {
              await this.eventBus.publish('email.sent.failed', {
                emailData: eventMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ EmailConsumer - Published email.sent.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ EmailConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 EmailConsumer - Started consuming messages from emails topic');
  }
} 