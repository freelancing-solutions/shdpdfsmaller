import { PdfApiService } from './api/pdf-services';
import { JobMonitor } from './api/job-monitor';

export interface CompressionOptions {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number;
}

export interface CompressionResult {
  compressedFile: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  reductionPercent: number;
  settings: CompressionOptions;
}

export class PDFCompressionService {
  private static instance: PDFCompressionService;

  static getInstance(): PDFCompressionService {
    if (!PDFCompressionService.instance) {
      PDFCompressionService.instance = new PDFCompressionService();
    }
    return PDFCompressionService.instance;
  }

  async compressPDF(file: File, options: CompressionOptions): Promise<CompressionResult> {
    try {
      const originalSize = file.size;
      
      // Create job via API
      const jobId = await PdfApiService.createJob('/compress', this.createFormData(file, options));
      
      // Wait for job completion and get result
      const resultBlob = await JobMonitor.executeWithJob(
        () => Promise.resolve(jobId),
        async (jobResponse) => {
          if (jobResponse.status === 'completed') {
            return await PdfApiService.downloadResult(jobId);
          }
          throw new Error(`Job failed: ${jobResponse.error}`);
        }
      );

      const compressedSize = resultBlob.size;
      const compressionRatio = compressedSize / originalSize;
      const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        compressedFile: resultBlob,
        originalSize,
        compressedSize,
        compressionRatio,
        reductionPercent,
        settings: options,
      };
    } catch (error) {
      console.error('PDF compression failed:', error);
      throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createFormData(file: File, options: CompressionOptions): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compressionLevel', options.compressionLevel);
    formData.append('imageQuality', options.imageQuality.toString());
    return formData;
  }

  async analyzePDF(file: File): Promise<{
    pageCount: number;
    size: number;
    compressionPotential: number;
    recommendedSettings: CompressionOptions;
  }> {
    try {
      // For analysis, we'll use a lightweight approach since we can't access PDF internals
      // via API. We'll estimate based on file size and type.
      
      const size = file.size;
      
      // Simple estimation - in a real implementation, you might want to create
      // a separate analysis endpoint or use a different approach
      let compressionPotential = 0.3; // Base 30% potential
      
      // Adjust based on file size
      if (size > 5 * 1024 * 1024) { // > 5MB
        compressionPotential += 0.2; // Large files have more potential
      } else if (size < 1024 * 1024) { // < 1MB
        compressionPotential -= 0.1; // Small files have less potential
      }
      
      // Determine recommended settings
      let recommendedLevel: CompressionOptions['compressionLevel'] = 'medium';
      let recommendedQuality = 80;
      
      if (compressionPotential > 0.5) {
        recommendedLevel = 'high';
        recommendedQuality = 70;
      } else if (compressionPotential < 0.3) {
        recommendedLevel = 'low';
        recommendedQuality = 90;
      }
      
      return {
        pageCount: this.estimatePageCount(size), // Estimated page count
        size,
        compressionPotential: Math.max(0.1, Math.min(0.8, compressionPotential)),
        recommendedSettings: {
          compressionLevel: recommendedLevel,
          imageQuality: recommendedQuality,
        },
      };
    } catch (error) {
      console.error('PDF analysis failed:', error);
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimatePageCount(fileSize: number): number {
    // Simple estimation: ~100KB per page on average
    return Math.max(1, Math.round(fileSize / (100 * 1024)));
  }

  async batchCompress(files: File[], options: CompressionOptions): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.compressPDF(files[i], options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress file ${files[i].name}:`, error);
        // Add a failed result with original file
        results.push({
          compressedFile: files[i],
          originalSize: files[i].size,
          compressedSize: files[i].size,
          compressionRatio: 1,
          reductionPercent: 0,
          settings: options,
        });
      }
    }
    
    return results;
  }
}