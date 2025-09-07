import { PdfApiService } from './api/pdf-services';
import { JobMonitor } from './api/job-monitor';

export interface ConversionOptions {
  format: 'docx' | 'txt' | 'html' | 'images';
  quality: 'low' | 'medium' | 'high';
  preserveFormatting: boolean;
  extractImages: boolean;
}

export interface ConversionResult {
  convertedFile: Blob;
  originalSize: number;
  convertedSize: number;
  format: string;
  processingTime: number;
  settings: ConversionOptions;
}

export class PDFConversionService {
  private static instance: PDFConversionService;

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
      const endpoint = this.getConversionEndpoint(options.format);
      const formData = this.createFormData(file, options);

      const resultBlob = await JobMonitor.executeWithJob(
        () => PdfApiService.createJob(endpoint, formData),
        async (jobResponse) => {
          if (jobResponse.status === 'completed') {
            return await PdfApiService.downloadResult(jobResponse.job_id);
          }
          throw new Error(`Job failed: ${jobResponse.error}`);
        }
      );

      const processingTime = Date.now() - startTime;
      const convertedSize = resultBlob.size;

      return {
        convertedFile: resultBlob,
        originalSize,
        convertedSize,
        format: options.format,
        processingTime,
        settings: options,
      };
    } catch (error) {
      console.error('PDF conversion failed:', error);
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getConversionEndpoint(format: ConversionOptions['format']): string {
    switch (format) {
      case 'txt':
        return '/convert/pdf-to-txt';
      case 'html':
        return '/convert/pdf-to-html';
      case 'docx':
        return '/convert/pdf-to-docx';
      case 'images':
        return '/convert/pdf-to-images';
      default:
        throw new Error(`Unsupported conversion format: ${format}`);
    }
  }

  private createFormData(file: File, options: ConversionOptions): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify({
      preserveLayout: options.preserveFormatting,
      extractImages: options.extractImages,
      quality: options.quality,
    }));
    return formData;
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
      // In a real scenario, this would call an API endpoint for analysis
      // For now, we'll simulate a basic analysis based on file size.
      const size = file.size;
      const pageCount = Math.max(1, Math.round(size / (100 * 1024))); // Estimate ~100KB per page

      const estimatedTime = pageCount * 2 + (size / (1024 * 1024)) * 0.5; // seconds

      const recommendedFormats = ['txt', 'html'];
      if (pageCount > 5) {
        recommendedFormats.push('docx');
      }
      if (size > 1024 * 1024) { // > 1MB
        recommendedFormats.push('images');
      }

      return {
        pageCount,
        size,
        textContent: true,
        images: true,
        recommendedFormats,
        estimatedProcessingTime: Math.round(estimatedTime),
      };
    } catch (error) {
      console.error('PDF analysis failed:', error);
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchConvert(files: File[], options: ConversionOptions): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    for (const file of files) {
      try {
        const result = await this.convertPDF(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        results.push({
          convertedFile: new Blob(['Conversion failed']),
          originalSize: file.size,
          convertedSize: 0,
          format: options.format,
          processingTime: 0,
          settings: options,
        });
      }
    }
    return results;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}


