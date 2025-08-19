import { OrderData, PaymentData, EmailData } from '../index';

export interface IOrderSagaOrchestrator {
  // Démarrage de la Saga
  startOrderSaga(orderData: OrderData): Promise<void>;
  
  // Gestion des événements de succès
  handleOrderCreatedSuccess(orderData: OrderData): Promise<void>;
  handlePaymentSuccess(paymentData: PaymentData): Promise<void>;
  handleEmailSentSuccess(emailData: EmailData): Promise<void>;
  
  // Gestion des événements d'échec
  handleOrderCreatedFailed(orderData: OrderData, error: any): Promise<void>;
  handlePaymentFailed(paymentData: PaymentData, error: any): Promise<void>;
  handleEmailSentFailed(emailData: EmailData, error: any): Promise<void>;
} 