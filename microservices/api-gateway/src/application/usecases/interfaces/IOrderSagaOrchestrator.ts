import { OrderData } from '../../../domain/ports';

export interface IOrderSagaOrchestrator {
  startOrderSaga(orderData: OrderData): Promise<void>;
} 