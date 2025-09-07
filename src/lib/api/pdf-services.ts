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

export class PdfApiService {
  private static readonly BASE_URL = process.env.API_URL || 'https://api.pdfsmaller.site/api';
  private static readonly DEFAULT_TIMEOUT = 300000;
  private static readonly POLL_INTERVAL = 2000;

  static async createJob(
    endpoint: string,
    formData: FormData,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<string> {
    try {
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
    } catch (error) {
      throw new Error(`Job creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getJobStatus(jobId: string): Promise<JobResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Job status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async downloadResult(jobId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.BASE_URL}/jobs/${jobId}/download`);
      
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

  static async compressPdf(
    file: File,
    settings: CompressionSettings,
    clientJobId?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compressionLevel', settings.compressionLevel);
    formData.append('imageQuality', settings.imageQuality.toString());
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob('/compress', formData);
  }

  static async convertPdf(
    file: File,
    targetFormat: 'docx' | 'xlsx' | 'txt' | 'html' | 'images',
    options: ConversionOptions = {},
    clientJobId?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob(`/convert/pdf-to-${targetFormat}`, formData);
  }

  static async processOCR(
    file: File,
    options: OCROptions = {},
    clientJobId?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    return this.createJob('/ocr/process', formData);
  }

  static async summarizeText(
    text: string,
    options: AIOptions = {},
    clientJobId?: string
  ): Promise<string> {
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
  }
}