import { IEmailService, EmailData, EmailResult } from '../../domain/ports';

export class EmailService implements IEmailService {

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      console.log('🔄 EmailService - Sending email...', { orderId: emailData.orderId, type: emailData.type });

      // Validation métier
      if (!this.validateEmail(emailData)) {
        throw new Error('Invalid email data');
      }

      // Simulation de l'envoi d'email
      await this.simulateEmailSending(emailData);

      const messageId = this.generateMessageId();
      const result: EmailResult = {
        orderId: emailData.orderId,
        success: true,
        messageId,
        sentAt: new Date().toISOString()
      };

      console.log('✅ EmailService - Email sent successfully', { orderId: emailData.orderId, messageId });
      return result;

    } catch (error) {
      console.error('❌ EmailService - Error sending email:', error);
      
      const result: EmailResult = {
        orderId: emailData.orderId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date().toISOString()
      };



      return result;
    }
  }

  private async simulateEmailSending(emailData: EmailData): Promise<void> {
    // Simulation d'un envoi d'email (SMTP, API, etc.)
    console.log('📧 EmailService - Sending email via SMTP...', { orderId: emailData.orderId });
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simuler un échec aléatoire (2% de chance)
    if (Math.random() < 0.02) {
      throw new Error('SMTP server unavailable');
    }
    
    console.log('📧 EmailService - Email sent via SMTP successfully');
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