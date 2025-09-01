export class RetryPattern {
  constructor(
    private readonly maxRetries = 3,
    private readonly baseDelay = 1000,
    private readonly maxDelay = 10000
  ) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${context} - Attempt ${attempt}/${this.maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          console.log(`❌ ${context} - All retries exhausted`);
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`⏳ ${context} - Retry in ${delay}ms (attempt ${attempt})`);
        await this.sleep(delay);
      }
    }

    throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  private calculateDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 