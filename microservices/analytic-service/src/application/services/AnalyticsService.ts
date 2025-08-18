import { IAnalyticsService, IEventBus, AnalyticsData, AnalyticsResult } from '../../domain/ports';

export class AnalyticsService implements IAnalyticsService {
  constructor(private eventBus: IEventBus) {}

  async processEvent(eventData: AnalyticsData): Promise<AnalyticsResult> {
    try {
      console.log('🔄 AnalyticsService - Processing event...', { 
        eventType: eventData.eventType, 
        orderId: eventData.orderId 
      });

      // Validation métier
      if (!this.validateEvent(eventData)) {
        throw new Error('Invalid analytics data');
      }

      // Simulation du traitement d'analytics
      const success = Math.random() > 0.01; // 99% de succès
      
      if (success) {
        const eventId = this.generateEventId();
        const result: AnalyticsResult = {
          eventId,
          success: true,
          processedAt: new Date().toISOString()
        };

        // Publier l'événement de succès
        await this.eventBus.publish('analytics.processed', {
          eventId,
          eventType: eventData.eventType,
          orderId: eventData.orderId,
          processedAt: result.processedAt
        });

        console.log('✅ AnalyticsService - Event processed successfully', { 
          eventId, 
          eventType: eventData.eventType 
        });
        return result;

      } else {
        const result: AnalyticsResult = {
          eventId: this.generateEventId(),
          success: false,
          error: 'Analytics processing failed',
          processedAt: new Date().toISOString()
        };

        // Publier l'événement d'échec
        await this.eventBus.publish('analytics.failed', {
          eventType: eventData.eventType,
          error: result.error,
          processedAt: result.processedAt
        });

        console.log('❌ AnalyticsService - Event processing failed', { 
          eventType: eventData.eventType 
        });
        return result;
      }

    } catch (error) {
      console.error('❌ AnalyticsService - Error processing event:', error);
      
      const result: AnalyticsResult = {
        eventId: this.generateEventId(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      };

      // Publier l'événement d'échec
      await this.eventBus.publish('analytics.failed', {
        eventType: eventData.eventType,
        error: result.error,
        processedAt: result.processedAt
      });

      return result;
    }
  }

  validateEvent(eventData: AnalyticsData): boolean {
    if (!eventData.eventType) {
      console.log('❌ AnalyticsService - Missing event type');
      return false;
    }

    if (!eventData.timestamp) {
      console.log('❌ AnalyticsService - Missing timestamp');
      return false;
    }

    console.log('✅ AnalyticsService - Event data validated');
    return true;
  }

  generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 