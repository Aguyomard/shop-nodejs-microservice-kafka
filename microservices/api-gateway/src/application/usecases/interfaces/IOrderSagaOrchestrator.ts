import { OrderData } from '../../../domain/ports';

export interface IOrderSagaOrchestrator {
  // Démarrage de la Saga - seule méthode publique
  startOrderSaga(orderData: OrderData): Promise<void>;
} 