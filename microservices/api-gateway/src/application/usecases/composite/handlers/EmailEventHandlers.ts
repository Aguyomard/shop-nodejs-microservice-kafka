import { EmailData } from '../../../../domain/ports';

export class EmailEventHandlers {
  async handleEmailSentSuccess(data: any): Promise<void> {
    const emailData = data as EmailData;
    console.log('✅ EmailEventHandlers - Email sent successfully for order:', emailData.orderId);
    console.log('🎉 EmailEventHandlers - Order saga completed successfully!');
  }

  async handleEmailSentFailed(data: any): Promise<void> {
    const emailData = data as EmailData;
    console.log('❌ EmailEventHandlers - Email sending failed for order:', emailData.orderId);
    console.log('⚠️ EmailEventHandlers - Order completed but email failed');
  }
}
