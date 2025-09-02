
// utils/api-client.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

/**
 * Standardized API client for file operations
 */
export class APIClient {
  private static baseUrl = '/api';

  /**
   * Upload file(s) to compression endpoint
   */
  static async compressFiles(
    files: File | File[],
    options: {
      compressionLevel?: 'low' | 'medium' | 'high' | 'maximum';
      imageQuality?: number;
    } = {},
    uploadOptions: FileUploadOptions = {}
  ): Promise<Blob> {
    const {
      compressionLevel = 'medium',
      imageQuality = 80
    } = options;

    const formData = new FormData();
    
    if (Array.isArray(files)) {
      if (files.length === 1) {
        formData.append('file', files[0]);
      } else {
        files.forEach(file => formData.append('files', file));
      }
    } else {
      formData.append('file', files);
    }
    
    formData.append('compressionLevel', compressionLevel);
    formData.append('imageQuality', imageQuality.toString());

    console.log('Compressing files:', Array.isArray(files) ? files.length : 1);

    try {
      const response = await fetch(`${this.baseUrl}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Log compression metadata from headers
      const metadata = this.extractMetadataFromHeaders(response.headers);
      console.log('Compression completed:', metadata);
      
      if (uploadOptions.onSuccess) {
        uploadOptions.onSuccess({ blob, metadata });
      }

      return blob;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      console.error('Compression error:', errorMessage);
      
      if (uploadOptions.onError) {
        uploadOptions.onError(errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Convert PDF to other format
   */
  static async convertFile(
    file: File,
    options: {
      format: 'docx' | 'txt' | 'html' | 'images';
      quality?: 'low' | 'medium' | 'high';
      preserveFormatting?: boolean;
      extractImages?: boolean;
    },
    uploadOptions: FileUploadOptions = {}
  ): Promise<Blob> {
    const {
      format,
      quality = 'medium',
      preserveFormatting = true,
      extractImages = false
    } = options;

    // Validate file type before sending
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files can be converted');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    formData.append('quality', quality);
    formData.append('preserveFormatting', preserveFormatting.toString());
    formData.append('extractImages', extractImages.toString());

    console.log('Converting file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      format,
      quality
    });

    try {
      const response = await fetch(`${this.baseUrl}/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Log conversion metadata from headers
      const metadata = this.extractMetadataFromHeaders(response.headers);
      console.log('Conversion completed:', metadata);
      
      if (uploadOptions.onSuccess) {
        uploadOptions.onSuccess({ blob, metadata });
      }

      return blob;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      console.error('Conversion error:', errorMessage);
      
      if (uploadOptions.onError) {
        uploadOptions.onError(errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Analyze PDF file
   */
  static async analyzeFile(
    file: File,
    options: {
      analysisType?: 'basic' | 'detailed' | 'compression-potential';
      includeMetadata?: boolean;
    } = {},
    uploadOptions: FileUploadOptions = {}
  ): Promise<any> {
    const {
      analysisType = 'basic',
      includeMetadata = true
    } = options;

    // Validate file type before sending
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files can be analyzed');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysisType', analysisType);
    formData.append('includeMetadata', includeMetadata.toString());

    console.log('Analyzing file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      analysisType
    });

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('Analysis completed:', result);
      
      if (uploadOptions.onSuccess) {
        uploadOptions.onSuccess(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      console.error('Analysis error:', errorMessage);
      
      if (uploadOptions.onError) {
        uploadOptions.onError(errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Extract metadata from response headers
   */
  private static extractMetadataFromHeaders(headers: Headers): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    for (const [key, value] of headers.entries()) {
      if (key.startsWith('x-')) {
        const cleanKey = key.substring(2).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        metadata[cleanKey] = value;
      }
    }
    
    return metadata;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB
      allowedTypes = ['application/pdf']
    } = options;

    if (!file || !(file instanceof File)) {
      return { isValid: false, error: 'Invalid file object' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { 
        isValid: false, 
        error: `File size (${this.formatFileSize(file.size)}) exceeds ${maxSizeMB}MB limit` 
      };
    }

    // Check file type - be flexible
    const isValidType = allowedTypes.some(type => {
      if (type === 'application/pdf') {
        return file.type === 'application/pdf' || 
               file.type === '' && file.name.toLowerCase().endsWith('.pdf');
      }
      return file.type === type;
    });

    if (!isValidType) {
      return { 
        isValid: false, 
        error: `Unsupported file type. Expected: ${allowedTypes.join(', ')}, got: ${file.type || 'unknown'}` 
      };
    }

    return { isValid: true };
  }
}