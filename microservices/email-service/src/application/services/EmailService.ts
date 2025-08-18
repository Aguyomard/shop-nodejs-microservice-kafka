import { IEmailService, IEventBus, EmailData, EmailResult } from '../../domain/ports';

export class EmailService implements IEmailService {
  constructor(private eventBus: IEventBus) {}

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      console.log('🔄 EmailService - Sending email...', { orderId: emailData.orderId, type: emailData.type });

      // Validation métier
      if (!this.validateEmail(emailData)) {
        throw new Error('Invalid email data');
      }

      // Simulation de l'envoi d'email
      const success = Math.random() > 0.02; // 98% de succès
      
      if (success) {
        const messageId = this.generateMessageId();
        const result: EmailResult = {
          orderId: emailData.orderId,
          success: true,
          messageId,
          sentAt: new Date().toISOString()
        };

        // Publier l'événement de succès
        await this.eventBus.publish('email.sent', {
          orderId: emailData.orderId,
          messageId,
          type: emailData.type,
          sentAt: result.sentAt
        });

        console.log('✅ EmailService - Email sent successfully', { orderId: emailData.orderId, messageId });
        return result;

      } else {
        const result: EmailResult = {
          orderId: emailData.orderId,
          success: false,
          error: 'Email sending failed',
          sentAt: new Date().toISOString()
        };

        // Publier l'événement d'échec
        await this.eventBus.publish('email.failed', {
          orderId: emailData.orderId,
          error: result.error,
          sentAt: result.sentAt
        });

        console.log('❌ EmailService - Email sending failed', { orderId: emailData.orderId });
        return result;
      }

    } catch (error) {
      console.error('❌ EmailService - Error sending email:', error);
      
      const result: EmailResult = {
        orderId: emailData.orderId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date().toISOString()
      };

      // Publier l'événement d'échec
      await this.eventBus.publish('email.failed', {
        orderId: emailData.orderId,
        error: result.error,
        sentAt: result.sentAt
      });

      return result;
    }
  }

  validateEmail(emailData: EmailData): boolean {
    if (!emailData.orderId || !emailData.userId || !emailData.email) {
      console.log('❌ EmailService - Missing required fields');
      return false;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.email)) {
      console.log('❌ EmailService - Invalid email format');
      return false;
    }

    if (!emailData.type) {
      console.log('❌ EmailService - Missing email type');
      return false;
    }

    console.log('✅ EmailService - Email data validated');
    return true;
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 