import { Kafka, Consumer } from 'kafkajs';
import { IEmailService } from '../../domain/ports';

export class EmailConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(private emailService: IEmailService) {
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
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log('📥 EmailConsumer - Received message:', {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: message.value?.toString()
          });

          if (!message.value) {
            console.log('⚠️ EmailConsumer - Empty message received');
            return;
          }

          const eventMessage = JSON.parse(message.value.toString());
          console.log('🔄 EmailConsumer - Processing event message:', eventMessage);

          // Extraire les données d'email du wrapper EventMessage
          const emailData = eventMessage.data;
          console.log('🔄 EmailConsumer - Extracted email data:', emailData);

          // Traiter l'email
          const result = await this.emailService.sendEmail(emailData);
          console.log('✅ EmailConsumer - Email processing completed:', result);

        } catch (error) {
          console.error('❌ EmailConsumer - Error processing message:', error);
        }
      }
    });

    console.log('🚀 EmailConsumer - Started consuming messages from emails topic');
  }
} 