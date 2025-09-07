export interface JobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  result?: any;
  error?: string;
}

export class PdfApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pdfsmaller.site/api';
  private static readonly DEFAULT_TIMEOUT = 300000;
  private static readonly POLL_INTERVAL = 2000;

  // Helper to check if we're in browser environment
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Helper to create timeout signal
  private static createTimeoutSignal(timeout: number): AbortSignal {
    if (typeof AbortSignal === 'undefined' || !AbortSignal.timeout) {
      // Fallback for environments without AbortSignal.timeout
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeout);
      return controller.signal;
    }
    return AbortSignal.timeout(timeout);
  }

  static async createJob(
    endpoint: string,
    formData: FormData,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<string> {
    if (!this.isBrowser()) {
      throw new Error('PDF compression is only available in browser environment');
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: this.createTimeoutSignal(timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: JobResponse = await response.json();
      
      if (!data.job_id) {
        throw new Error('No job ID received from API');
      }

      return data.job_id;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout exceeded');
      }
      throw error;
    }
  }

  static async getJobStatus(jobId: string): Promise<JobResponse> {
    if (!this.isBrowser()) {
      throw new Error('Job status checking is only available in browser environment');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}`, {
        signal: this.createTimeoutSignal(10000),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Job status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async downloadResult(jobId: string): Promise<Blob> {
    if (!this.isBrowser()) {
      throw new Error('Download is only available in browser environment');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}/download`, {
        signal: this.createTimeoutSignal(30000),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download result: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async waitForJobCompletion(
    jobId: string,
    checkInterval: number = this.POLL_INTERVAL,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<JobResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getJobStatus(jobId);

        switch (status.status) {
          case 'completed':
            return status;
          case 'failed':
            throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
          case 'pending':
          case 'processing':
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            break;
          default:
            throw new Error(`Unknown job status: ${status.status}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Job failed')) {
          throw error;
        }
        console.warn('Polling error, will retry:', error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Job timeout exceeded');
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`, {
        signal: this.createTimeoutSignal(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}