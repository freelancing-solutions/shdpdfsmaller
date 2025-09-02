export interface ConversionOptions {
  format: 'docx' | 'txt' | 'html' | 'images';
  quality: 'low' | 'medium' | 'high';
  preserveFormatting: boolean;
  extractImages: boolean;
}

export interface ConversionResult {
  convertedFile: Blob | string; // URL or Blob depending on API response
  originalSize: number;
  convertedSize: number;
  format: string;
  processingTime: number;
  settings: ConversionOptions;
  jobId?: string;
  downloadUrl?: string;
}

export interface ConversionStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
  error?: string;
}

export class PDFConversionService {
  private static instance: PDFConversionService;
  private readonly apiBaseUrl = 'https://api.pdfsmaller.site/api';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  static getInstance(): PDFConversionService {
    if (!PDFConversionService.instance) {
      PDFConversionService.instance = new PDFConversionService();
    }
    return PDFConversionService.instance;
  }

  async convertPDF(file: File, options: ConversionOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const originalSize = file.size;
    
    try {
      // Step 1: Upload file and start conversion
      const jobId = await this.uploadAndStartConversion(file, options);
      
      // Step 2: Poll for completion
      const result = await this.pollConversionStatus(jobId);
      
      // Step 3: Download converted file
      const convertedFile = await this.downloadConvertedFile(result.downloadUrl!);
      
      return {
        convertedFile,
        originalSize,
        convertedSize: convertedFile instanceof Blob ? convertedFile.size : 0,
        format: options.format,
        processingTime: Date.now() - startTime,
        settings: options,
        jobId,
        downloadUrl: result.downloadUrl,
      };
    } catch (error) {
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadAndStartConversion(file: File, options: ConversionOptions): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', options.format);
    formData.append('quality', options.quality);
    formData.append('preserveFormatting', options.preserveFormatting.toString());
    formData.append('extractImages', options.extractImages.toString());

    const response = await this.makeApiRequest('/convert', {
      method: 'POST',
      body: formData,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to start conversion');
    }

    return response.jobId;
  }

  async getConversionStatus(jobId: string): Promise<ConversionStatus> {
    const response = await this.makeApiRequest(`/status/${jobId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get conversion status');
    }

    return {
      jobId,
      status: response.status,
      progress: response.progress || 0,
      estimatedTime: response.estimatedTime,
      error: response.error,
    };
  }

  private async pollConversionStatus(jobId: string): Promise<ConversionStatus> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      const status = await this.getConversionStatus(jobId);
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Conversion failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error('Conversion timeout');
  }

  private async downloadConvertedFile(downloadUrl: string): Promise<Blob> {
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download converted file');
    }
    
    return await response.blob();
  }

  async cancelConversion(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeApiRequest(`/cancel/${jobId}`, {
        method: 'POST',
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to cancel conversion:', error);
      return false;
    }
  }

  async analyzePDF(file: File): Promise<{
    pageCount: number;
    size: number;
    textContent: boolean;
    images: boolean;
    recommendedFormats: string[];
    estimatedProcessingTime: number;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.makeApiRequest('/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.success) {
        throw new Error(response.error || 'PDF analysis failed');
      }

      return {
        pageCount: response.pageCount,
        size: file.size,
        textContent: response.hasText,
        images: response.hasImages,
        recommendedFormats: response.recommendedFormats || ['txt', 'html'],
        estimatedProcessingTime: response.estimatedTime || 30,
      };
    } catch (error) {
      throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchConvert(files: File[], options: ConversionOptions): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const batchSize = 3; // Process 3 files concurrently
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(file => 
        this.convertPDF(file, options).catch(error => ({
          convertedFile: new Blob(['Conversion failed']),
          originalSize: file.size,
          convertedSize: 0,
          format: options.format,
          processingTime: 0,
          settings: options,
          error: error.message,
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async getConversionHistory(): Promise<ConversionResult[]> {
    try {
      const response = await this.makeApiRequest('/history');
      
      if (!response.success) {
        throw new Error('Failed to fetch conversion history');
      }
      
      return response.conversions || [];
    } catch (error) {
      console.error('Failed to fetch conversion history:', error);
      return [];
    }
  }

  async getSupportedFormats(): Promise<string[]> {
    try {
      const response = await this.makeApiRequest('/formats');
      
      if (!response.success) {
        return ['txt', 'html', 'docx', 'images']; // fallback
      }
      
      return response.formats;
    } catch (error) {
      console.error('Failed to fetch supported formats:', error);
      return ['txt', 'html', 'docx', 'images']; // fallback
    }
  }

  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...options.headers,
          },
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError!;
  }

  // Utility methods for frontend integration
  getProcessingStatusMessage(status: ConversionStatus): string {
    switch (status.status) {
      case 'pending':
        return 'Your file is in the queue...';
      case 'processing':
        return `Processing... ${status.progress}% complete`;
      case 'completed':
        return 'Conversion completed successfully!';
      case 'failed':
        return `Conversion failed: ${status.error || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatProcessingTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF' };
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 50MB' };
    }
    
    return { valid: true };
  }
}