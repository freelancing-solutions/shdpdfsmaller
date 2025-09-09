// lib/api/pdf-services.ts - Fixed for Next.js backend usage

export interface JobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  result?: any;
  error?: string;
  download_url?: string;
  download_available?: boolean;
}

export interface CompressionSettings {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number;
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
  private static readonly BASE_URL = process.env.FLASK_API_URL || 'https://api.pdfsmaller.site/api';
  private static readonly DEFAULT_TIMEOUT = 300000;
  private static readonly POLL_INTERVAL = 2000;

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
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Operation timed out after ${retryConfig.timeoutMs}ms`)), retryConfig.timeoutMs);
        });

        const result = await Promise.race([operation(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;

        const shouldRetry = this.shouldRetry(error as Error, attempt, retryConfig);
        
        if (!shouldRetry) {
          break;
        }

        const delay = Math.min(
          retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelayMs
        ) + Math.random() * 1000;

        console.warn(`[PdfApiService] Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms. Error: ${lastError.message}`);

        if (attempt < retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`All ${retryConfig.maxRetries + 1} attempts failed. Last error: ${lastError?.message}`);
  }

  private static shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Network/timeout errors
    if (error.message.includes('timeout') || 
        error.message.includes('ECONNRESET') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('network') ||
        error.message.includes('fetch')) {
      return true;
    }

    // HTTP status code errors
    const statusMatch = error.message.match(/(?:status|error).*?(\d{3})/i);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      return config.retryableStatusCodes.includes(statusCode);
    }

    return false;
  }

  private static async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    return response;
  }

  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
      } catch (parseError) {
        console.warn('[PdfApiService] Failed to parse error response:', parseError);
      }

      throw new Error(`API error ${response.status}: ${errorMessage}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.blob();
  }

  static async createJob(
    endpoint: string,
    formData: FormData,
    timeout: number = this.DEFAULT_TIMEOUT,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<string> {
    return this.withRetry(async () => {
      const url = `${this.BASE_URL}${endpoint}`;
      console.log(`[PdfApiService] Creating job at: ${url}`);
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: formData,
      });

      const data: JobResponse = await this.handleResponse(response);
      console.log('[createJob] raw response →', JSON.stringify(data, null, 2)); // ← NEW
      if (!data.job_id) {
        throw new Error('No job ID received from API');
      }

      console.log(`[PdfApiService] Job created: ${data.job_id}`);
      return data.job_id;
    }, { ...retryConfig, timeoutMs: timeout });
  }

  static async getJobStatus(
    jobId: string, 
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<JobResponse> {
    if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
      throw new Error('Invalid job ID provided');
    }

    return this.withRetry(async () => {
      const url = `${this.BASE_URL}/jobs/${encodeURIComponent(jobId.trim())}`;
      
      const response = await this.makeRequest(url, {
        method: 'GET',
      });

      const envelope = await this.handleResponse(response);   // ← new
      const jobResponse: JobResponse = envelope?.data ?? envelope; // ← unwrap

      if (!jobResponse.job_id) {
        throw new Error('Invalid job response: missing job_id');
      }

      return jobResponse;
    }, retryConfig);
  }

  static async downloadResult(
    jobId: string, 
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<Blob> {
    if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
      throw new Error('Invalid job ID provided');
    }

    return this.withRetry(async () => {
      const url = `${this.BASE_URL}/jobs/${encodeURIComponent(jobId.trim())}/download`;
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, application/octet-stream'
        }
      });

      const blob = await this.handleResponse(response);
      
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('Downloaded file is empty or invalid');
      }

      return blob;
    }, { ...retryConfig, timeoutMs: 60000 }); // Longer timeout for downloads
  }

  static async waitForJobCompletion(
    jobId: string,
    checkInterval: number = this.POLL_INTERVAL,
    timeout: number = this.DEFAULT_TIMEOUT,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<JobResponse> {
    if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
      throw new Error('Invalid job ID provided');
    }

    const startTime = Date.now();
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    console.log(`[PdfApiService] Waiting for job completion: ${jobId}`);

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getJobStatus(jobId, {
          ...retryConfig,
          maxRetries: 1 // Reduce retries during polling
        });

        consecutiveErrors = 0; // Reset on success

        console.log(`[PdfApiService] Job ${jobId} status: ${status.status}`);

        switch (status.status) {
          case 'completed':
            console.log(`[PdfApiService] Job ${jobId} completed successfully`);
            return status;
          case 'failed':
            throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
          case 'pending':
          case 'processing':
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            break;
          default:
            console.warn(`[PdfApiService] Unknown job status: ${status.status}`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            break;
        }
      } catch (error) {
        consecutiveErrors++;
        
        if (error instanceof Error && error.message.includes('Job failed')) {
          throw error;
        }
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Job monitoring failed after ${maxConsecutiveErrors} consecutive errors. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          throw new Error('Job timeout exceeded');
        }
        
        console.warn(`[PdfApiService] Polling error ${consecutiveErrors}/${maxConsecutiveErrors}, will retry:`, error);
        await new Promise(resolve => setTimeout(resolve, checkInterval * Math.max(1, consecutiveErrors)));
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
    if (!file || file.size === 0) {
      throw new Error('Invalid file provided');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('compressionLevel', settings.compressionLevel);
    formData.append('imageQuality', settings.imageQuality.toString());
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob('/compress', formData, this.DEFAULT_TIMEOUT, retryConfig);
  }

  // Health check method
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.BASE_URL}/health`, {
        method: 'GET',
      });
      
      const health = await this.handleResponse(response);
      return health.success === true;
    } catch (error) {
      console.error('[PdfApiService] Health check failed:', error);
      return false;
    }
  }
}