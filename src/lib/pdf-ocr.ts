import { PdfApiService } from './api/pdf-services';
import { JobMonitor } from './api/job-monitor';

export interface OCROptions {
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
  outputFormat: 'txt' | 'pdf' | 'docx' | 'searchable-pdf';
  preserveLayout: boolean;
  confidence: number;
}

export interface OCRResult {
  processedFile: Blob;
  originalSize: number;
  processedSize: number;
  extractedText: string;
  confidence: number;
  processingTime: number;
  settings: OCROptions;
}

export class PDFOCRService {
  private static instance: PDFOCRService;

  static getInstance(): PDFOCRService {
    if (!PDFOCRService.instance) {
      PDFOCRService.instance = new PDFOCRService();
    }
    return PDFOCRService.instance;
  }

  async processOCR(file: File, options: OCROptions): Promise<OCRResult> {
    const startTime = Date.now();
    const originalSize = file.size;

    try {
      const formData = this.createFormData(file, options);

      const resultBlob = await JobMonitor.executeWithJob(
        () => PdfApiService.createJob('/ocr/process', formData),
        async (jobResponse) => {
          if (jobResponse.status === 'completed') {
            const downloadedBlob = await PdfApiService.downloadResult(jobResponse.job_id);
            // The API returns the processed file. We need to simulate extractedText and confidence
            // as the original interface expects them. In a real scenario, the API would return these.
            const extractedText = `Text extracted from ${file.name} (simulated)`;
            const confidence = 90; // Simulated confidence

            return { blob: downloadedBlob, extractedText, confidence };
          }
          throw new Error(`Job failed: ${jobResponse.error}`);
        }
      );

      const processingTime = Date.now() - startTime;
      const processedSize = resultBlob.blob.size;

      return {
        processedFile: resultBlob.blob,
        originalSize,
        processedSize,
        extractedText: resultBlob.extractedText,
        confidence: resultBlob.confidence,
        processingTime,
        settings: options,
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`Failed to process OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createFormData(file: File, options: OCROptions): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify({
      language: options.language,
      quality: this.mapConfidenceToQuality(options.confidence),
      outputFormat: this.mapOutputFormat(options.outputFormat),
      preserveLayout: options.preserveLayout,
    }));
    return formData;
  }

  private mapConfidenceToQuality(confidence: number): 'fast' | 'balanced' | 'accurate' {
    if (confidence >= 90) return 'accurate';
    if (confidence >= 70) return 'balanced';
    return 'fast';
  }

  private mapOutputFormat(outputFormat: OCROptions['outputFormat']): 'searchable_pdf' | 'text' | 'json' {
    switch (outputFormat) {
      case 'searchable-pdf':
        return 'searchable_pdf';
      case 'txt':
        return 'text';
      case 'docx':
        // Assuming docx output from API would be a 'searchable_pdf' or 'text' that then gets converted client-side if needed
        // For now, mapping to searchable_pdf as it's a common OCR output type that preserves layout.
        return 'searchable_pdf'; 
      case 'pdf':
        return 'searchable_pdf'; // Original PDF output might be searchable PDF after OCR
      default:
        return 'text';
    }
  }

  async analyzePDF(file: File): Promise<{
    pageCount: number;
    size: number;
    estimatedProcessingTime: number;
    recommendedSettings: OCROptions;
    textDensity: 'low' | 'medium' | 'high';
  }> {
    try {
      // Simulate analysis based on file size, as API doesn't provide a direct analysis endpoint
      const size = file.size;
      const pageCount = Math.max(1, Math.round(size / (100 * 1024))); // Estimate ~100KB per page

      const estimatedTime = pageCount * 2 + (size / (1024 * 1024)) * 0.5; // seconds

      let textDensity: 'low' | 'medium' | 'high' = 'medium';
      if (size / pageCount > 1024 * 1024) { // > 1MB per page
        textDensity = 'high';
      } else if (size / pageCount < 100 * 1024) { // < 100KB per page
        textDensity = 'low';
      }

      const recommendedSettings: OCROptions = {
        language: 'en',
        outputFormat: textDensity === 'high' ? 'searchable-pdf' : 'txt',
        preserveLayout: textDensity !== 'low',
        confidence: textDensity === 'high' ? 95 : 85,
      };

      return {
        pageCount,
        size,
        estimatedProcessingTime: Math.round(estimatedTime),
        recommendedSettings,
        textDensity,
      };
    } catch (error) {
      console.error('PDF analysis failed:', error);
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchProcess(files: File[], options: OCROptions): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    for (const file of files) {
      try {
        const result = await this.processOCR(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process OCR for ${file.name}:`, error);
        results.push({
          processedFile: new Blob([]),
          originalSize: file.size,
          processedSize: 0,
          extractedText: '',
          confidence: 0,
          processingTime: 0,
          settings: options,
        });
      }
    }
    return results;
  }
}


