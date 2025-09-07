// lib/api/pdf-services.ts
export interface JobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  result?: any;
  error?: string;
}

export interface CompressionSettings {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number; // 10-100
}

export interface ConversionOptions {
  preserveLayout?: boolean;
  extractTables?: boolean;
  extractImages?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export interface OCROptions {
  language?: string;
  quality?: 'fast' | 'balanced' | 'accurate';
  outputFormat?: 'searchable_pdf' | 'text' | 'json';
}

export interface AIOptions {
  style?: 'concise' | 'detailed' | 'academic' | 'casual' | 'professional';
  maxLength?: 'short' | 'medium' | 'long';
  targetLanguage?: string; // ISO language code
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
  timeoutMs: number;
}

export class PdfApiService {
  private static readonly BASE_URL = process.env.API_URL || 'https://api.pdfsmaller.site/api';
  private static readonly DEFAULT_TIMEOUT = 300000;
  private static readonly POLL_INTERVAL = 2000;

  // Default retry configuration
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    timeoutMs: 30000
  };

  private static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Use Promise.race to implement timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Operation timed out after ${retryConfig.timeoutMs}ms`)), retryConfig.timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if this error should be retried
        const shouldRetry = this.shouldRetry(error as Error, attempt, retryConfig);
        
        if (!shouldRetry) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelayMs
        ) + Math.random() * 1000; // Add jitter

        console.warn(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms. Error: ${lastError.message}`);

        if (attempt < retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`All ${retryConfig.maxRetries} attempts failed. Last error: ${lastError?.message}`);
  }

  private static shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Check for network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('504') || error.message.includes('network')) {
      return true;
    }

    // Check for retryable HTTP status codes
    const statusMatch = error.message.match(/API error: (\d+)/);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      return config.retryableStatusCodes.includes(statusCode);
    }

    // Don't retry on client errors (4xx) except 408 and 429
    if (error.message.includes('API error: 4') && 
        !error.message.includes('API error: 408') && 
        !error.message.includes('API error: 429')) {
      return false;
    }

    // Retry on other server errors
    return error.message.includes('API error: 5');
  }

  static async createJob(
    endpoint: string,
    formData: FormData,
    timeout: number = this.DEFAULT_TIMEOUT,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
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
    }, { ...retryConfig, timeoutMs: timeout });
  }

  static async getJobStatus(
    jobId: string, 
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<JobResponse> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      return await response.json();
    }, retryConfig);
  }

  static async downloadResult(
    jobId: string, 
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}/download`);
      
      if (!response.ok) {
        throw new Error(`Failed to download result: ${response.status}`);
      }

      return await response.blob();
    }, retryConfig);
  }

  static async waitForJobCompletion(
    jobId: string,
    checkInterval: number = this.POLL_INTERVAL,
    timeout: number = this.DEFAULT_TIMEOUT,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<JobResponse> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getJobStatus(jobId, retryConfig);

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
        
        // For polling errors, we'll continue polling unless we hit timeout
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          throw new Error('Job timeout exceeded');
        }
        
        console.warn('Polling error, will retry:', error);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('Job timeout exceeded');
  }

  static async compressPdf(
    file: File,
    settings: CompressionSettings,
    clientJobId?: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compressionLevel', settings.compressionLevel);
    formData.append('imageQuality', settings.imageQuality.toString());
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob('/compress', formData, this.DEFAULT_TIMEOUT, retryConfig);
  }

  static async convertPdf(
    file: File,
    targetFormat: 'docx' | 'xlsx' | 'txt' | 'html' | 'images',
    options: ConversionOptions = {},
    clientJobId?: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob(`/convert/pdf-to-${targetFormat}`, formData, this.DEFAULT_TIMEOUT, retryConfig);
  }

  static async processOCR(
    file: File,
    options: OCROptions = {},
    clientJobId?: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob('/ocr/process', formData, this.DEFAULT_TIMEOUT, retryConfig);
  }

  static async summarizeText(
    text: string,
    options: AIOptions = {},
    clientJobId?: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.BASE_URL}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          options,
          client_job_id: clientJobId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: JobResponse = await response.json();
      return data.job_id;
    }, retryConfig);
  }
}