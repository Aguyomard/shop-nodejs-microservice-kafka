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
      // 🔄 NOUVEAU : Écouter les COMMANDS (ce qu'on veut faire)
      await this.consumer.subscribe({ topic: 'emails-commands', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 EmailConsumer connected to emails-commands topic');
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
          console.log('📥 EmailConsumer - Received command from emails-commands topic');

          if (!message.value) {
            console.log('⚠️ EmailConsumer - Empty message received');
            return;
          }

          const commandMessage = JSON.parse(message.value.toString());
          console.log('🔄 EmailConsumer - Processing email command:', commandMessage.eventType);

          // 🔄 NOUVEAU : Traiter les COMMANDS et publier les EVENTS
          switch (commandMessage.eventType) {
            case 'email.send':
              await this.handleEmailSend(commandMessage.data);
              break;
            case 'email.schedule':
              await this.handleEmailSchedule(commandMessage.data);
              break;
            case 'email.cancel':
              await this.handleEmailCancel(commandMessage.data);
              break;
            default:
              console.log('⚠️ EmailConsumer - Unknown command:', commandMessage.eventType);
          }

        } catch (error) {
          console.error('❌ EmailConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const commandMessage = JSON.parse(message.value?.toString() || '{}');
            if (commandMessage.eventType === 'email.send') {
              await this.eventBus.publish('email.failed', {
                data: commandMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ EmailConsumer - Published email.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ EmailConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 EmailConsumer - Started consuming commands from emails-commands topic');
  }

  // 🔄 NOUVELLES MÉTHODES : Gestion des différentes commands
  private async handleEmailSend(emailData: any): Promise<void> {
    try {
      console.log('🔄 EmailConsumer - Processing email.send command:', emailData);

      // Traiter l'email
      const result = await this.emailService.sendEmail(emailData);
      
      // Publier l'EVENT de résultat
      if (result.success) {
        await this.eventBus.publish('email.sent', {
          orderId: emailData.orderId,
          userId: emailData.userId,
          data: emailData,
          timestamp: new Date().toISOString()
        });
        console.log('✅ EmailConsumer - Published email.sent EVENT');
      } else {
        await this.eventBus.publish('email.failed', {
          data: emailData,
          error: result.error
        });
        console.log('❌ EmailConsumer - Published email.failed EVENT');
      }
    } catch (error) {
      console.error('❌ EmailConsumer - Error handling email.send:', error);
      await this.eventBus.publish('email.failed', {
        data: emailData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleEmailSchedule(emailData: any): Promise<void> {
    try {
      console.log('🔄 EmailConsumer - Processing email.schedule command:', emailData);
      
      // Logique de programmation d'email
      await this.eventBus.publish('email.scheduled', {
        orderId: emailData.orderId,
        userId: emailData.userId,
        data: emailData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ EmailConsumer - Published email.scheduled EVENT');
    } catch (error) {
      console.error('❌ EmailConsumer - Error handling email.schedule:', error);
    }
  }

  private async handleEmailCancel(emailData: any): Promise<void> {
    try {
      console.log('🔄 EmailConsumer - Processing email.cancel command:', emailData);
      
      // Logique d'annulation d'email
      await this.eventBus.publish('email.cancelled', {
        orderId: emailData.orderId,
        userId: emailData.userId,
        data: emailData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ EmailConsumer - Published email.cancelled EVENT');
    } catch (error) {
      console.error('❌ EmailConsumer - Error handling email.cancel:', error);
    }
  }
} 