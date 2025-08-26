import { Kafka, Consumer } from 'kafkajs';
import { IOrderService, IEventBus } from '../../domain/ports';

export class OrderConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor(
    private orderService: IOrderService,
    private eventBus: IEventBus
  ) {
    this.kafka = new Kafka({
      clientId: 'order-service-consumer',
      brokers: ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'order-service-group' });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.consumer.connect();
      // 🔄 NOUVEAU : Écouter les COMMANDS (ce qu'on veut faire)
      await this.consumer.subscribe({ topic: 'orders-commands', fromBeginning: true });
      this.isConnected = true;
      console.log('🔌 OrderConsumer connected to orders-commands topic');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 OrderConsumer disconnected from Kafka');
    }
  }

  async startConsuming(): Promise<void> {
    await this.connect();

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          console.log('📥 OrderConsumer - Received message from orders-commands topic');

          if (!message.value) {
            console.log('⚠️ OrderConsumer - Empty message received');
            return;
          }

          const commandMessage = JSON.parse(message.value.toString());
          console.log('🔄 OrderConsumer - Processing command:', commandMessage.eventType);

          // 🔄 NOUVEAU : Traiter les COMMANDS et publier les EVENTS
          switch (commandMessage.eventType) {
            case 'order.create':
              await this.handleOrderCreate(commandMessage.data);
              break;
            case 'order.confirm':
              await this.handleOrderConfirm(commandMessage.data);
              break;
            case 'order.cancel':
              await this.handleOrderCancel(commandMessage.data);
              break;
            default:
              console.log('⚠️ OrderConsumer - Unknown command:', commandMessage.eventType);
          }

        } catch (error) {
          console.error('❌ OrderConsumer - Error processing message:', error);
          
          // En cas d'erreur, publier l'échec
          try {
            const commandMessage = JSON.parse(message.value?.toString() || '{}');
            if (commandMessage.eventType === 'order.create') {
              await this.eventBus.publish('order.creation.failed', {
                orderData: commandMessage.data,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.log('❌ OrderConsumer - Published order.creation.failed due to error');
            }
          } catch (publishError) {
            console.error('❌ OrderConsumer - Error publishing failure event:', publishError);
          }
        }
      }
    });

    console.log('🚀 OrderConsumer - Started consuming commands from orders-commands topic');
  }

  // 🔄 NOUVELLES MÉTHODES : Gestion des différentes commands
  private async handleOrderCreate(orderData: any): Promise<void> {
    try {
      console.log('🔄 OrderConsumer - Processing order.create command:', orderData);

      // Traiter la commande
      const result = await this.orderService.processOrder(orderData);
      
      // Publier l'EVENT de résultat
      if (result.success) {
        // 🔄 CORRECTION : Structure directe pour correspondre à OrderData
        await this.eventBus.publish('order.created', {
          orderId: result.orderId || orderData.orderId,
          cart: orderData.cart,
          userId: orderData.userId,
          total: orderData.total,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        console.log('✅ OrderConsumer - Published order.created EVENT');
      } else {
        await this.eventBus.publish('order.creation.failed', {
          orderData,
          error: result.error
        });
        console.log('❌ OrderConsumer - Published order.creation.failed EVENT');
      }
    } catch (error) {
      console.error('❌ OrderConsumer - Error handling order.create:', error);
      await this.eventBus.publish('order.creation.failed', {
        orderData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleOrderConfirm(orderData: any): Promise<void> {
    try {
      console.log('🔄 OrderConsumer - Processing order.confirm command:', orderData);
      
      // Logique de confirmation de commande
      await this.eventBus.publish('order.confirmed', {
        orderId: orderData.orderId,
        data: orderData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ OrderConsumer - Published order.confirmed EVENT');
    } catch (error) {
      console.error('❌ OrderConsumer - Error handling order.confirm:', error);
    }
  }

  private async handleOrderCancel(orderData: any): Promise<void> {
    try {
      console.log('🔄 OrderConsumer - Processing order.cancel command:', orderData);
      
      // Logique d'annulation de commande
      await this.eventBus.publish('order.cancelled', {
        orderId: orderData.orderId,
        data: orderData,
        timestamp: new Date().toISOString()
      });
      console.log('✅ OrderConsumer - Published order.cancelled EVENT');
    } catch (error) {
      console.error('❌ OrderConsumer - Error handling order.cancel:', error);
    }
  }
} 