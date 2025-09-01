import { IEventBus } from '../../domain/ports';

export interface ErrorContext {
  operation: string;
  orderId: string;
  userId: string;
  data?: any;
}

export class ErrorHandlingService {
  constructor(private eventBus: IEventBus) {}

  async trackFailure(context: ErrorContext, error: Error): Promise<void> {
    await this.eventBus.publish('monitoring.failure', {
      operation: context.operation,
      error: error.message,
      context: context.data,
      timestamp: new Date().toISOString(),
      retryAttempts: 3,
      sagaStep: context.operation,
      severity: this.determineErrorSeverity(error)
    });
  }

  async escalateToManualIntervention(context: ErrorContext, error: Error): Promise<void> {
    await this.eventBus.publish('error.manual_intervention_required', {
      orderId: context.orderId,
      error: error.message,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      context: {
        sagaStep: context.operation,
        originalError: error.message,
        retryAttempts: 3
      }
    });
    console.log('🚨 ErrorHandlingService - Escalated to manual intervention');
  }

  private determineErrorSeverity(error: Error): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return 'MEDIUM';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('business rule')) {
      return 'LOW';
    }
    
    if (errorMessage.includes('infrastructure') || errorMessage.includes('database')) {
      return 'HIGH';
    }
    
    if (errorMessage.includes('compensation') || errorMessage.includes('saga')) {
      return 'CRITICAL';
    }
    
    return 'MEDIUM';
  }
}
