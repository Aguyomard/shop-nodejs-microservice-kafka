import { IEventBus } from '../../domain/ports';

export interface AnalyticsData {
  eventType: string;
  orderId: string;
  userId: string;
  data: {
    total: number;
    cart: any[];
    status?: string;
  };
  timestamp: string;
}

export class AnalyticsService {
  constructor(private eventBus: IEventBus) {}

  async publishOrderAnalytics(eventType: string, data: any): Promise<void> {
    try {
      const analyticsData: AnalyticsData = {
        eventType,
        orderId: data.orderId,
        userId: data.userId,
        data: {
          total: data.total,
          cart: data.cart,
          status: data.status
        },
        timestamp: new Date().toISOString()
      };

      await this.eventBus.publish('analytics.collect', analyticsData);
      console.log('📊 AnalyticsService - Published analytics COMMAND:', eventType);
    } catch (error) {
      console.error('❌ AnalyticsService - Error publishing analytics:', error);
      // Ne pas faire échouer la saga si l'analytics échoue
    }
  }
}
