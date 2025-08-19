import { Request, Response } from 'express';
import { IAnalyticsService } from '../../domain/ports';

export class AnalyticsController {
  constructor(private analyticsService: IAnalyticsService) {}

  // GET /analytics/orders - Obtenir toutes les métriques d'orders
  async getAllOrderMetrics(_req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 AnalyticsController - Getting all order metrics');
      
      const metrics = this.analyticsService.getAllOrderMetrics();
      
      res.status(200).json({
        success: true,
        data: {
          totalOrders: metrics.length,
          orders: metrics
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ AnalyticsController - Retrieved all order metrics:', { count: metrics.length });

    } catch (error) {
      console.error('❌ AnalyticsController - Error getting all order metrics:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order metrics',
        timestamp: new Date().toISOString()
      });
    }
  }

  // GET /analytics/orders/:orderId - Obtenir les métriques d'un order spécifique
  async getOrderMetrics(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params['orderId'];
      
      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log('📊 AnalyticsController - Getting metrics for order:', orderId);
      
      const metrics = this.analyticsService.getOrderMetrics(orderId);
      
      if (!metrics) {
        res.status(404).json({
          success: false,
          error: 'Order metrics not found',
          orderId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          orderId,
          metrics
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ AnalyticsController - Retrieved metrics for order:', orderId);

    } catch (error) {
      console.error('❌ AnalyticsController - Error getting order metrics:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order metrics',
        orderId: req.params['orderId'],
        timestamp: new Date().toISOString()
      });
    }
  }

  // GET /analytics/orders/stats/summary - Obtenir un résumé des statistiques
  async getOrderStatsSummary(_req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 AnalyticsController - Getting order stats summary');
      
      const allMetrics = this.analyticsService.getAllOrderMetrics();
      
      // Calculer les statistiques
      const stats = this.calculateOrderStats(allMetrics);
      
      res.status(200).json({
        success: true,
        data: {
          summary: stats,
          totalOrders: allMetrics.length
        },
        timestamp: new Date().toISOString()
      });

      console.log('✅ AnalyticsController - Retrieved order stats summary:', stats);

    } catch (error) {
      console.error('❌ AnalyticsController - Error getting order stats summary:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve order stats summary',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Méthode privée pour calculer les statistiques
  private calculateOrderStats(metrics: any[]): any {
    if (metrics.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        successRate: 0,
        averageProcessingTime: 0,
        statusBreakdown: {}
      };
    }

    const totalOrders = metrics.length;
    const totalRevenue = metrics.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalRevenue / totalOrders;
    
    const successfulOrders = metrics.filter(order => order.status === 'confirmed').length;
    const successRate = (successfulOrders / totalOrders) * 100;
    
    const processingTimes = metrics
      .filter(order => order.processingTime)
      .map(order => order.processingTime);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    // Breakdown par statut
    const statusBreakdown = metrics.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime),
      statusBreakdown
    };
  }
} 