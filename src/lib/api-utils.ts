// lib/api-utils.ts

import { NextRequest } from 'next/server';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  required?: boolean;
}

export interface ParsedFormData {
  file: File | null;
  files: File[];
  params: Record<string, string>;
}

/**
 * Standardized file extraction and validation for all API routes
 */
export class APIFileHandler {
  private static readonly DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DEFAULT_ALLOWED_TYPES = ['application/pdf'];

  /**
   * Parse form data and extract files with validation
   */
  static async parseFormData(
    request: NextRequest,
    options: FileValidationOptions = {}
  ): Promise<ParsedFormData> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES,
      required = true
    } = options;

    try {
      const formData = await request.formData();
      
      // Debug logging
      console.log('=== FORM DATA PARSING ===');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Extract single file (multiple field names for compatibility)
      let file: File | null = null;
      const fileFields = ['file', 'pdf', 'document'];
      
      for (const fieldName of fileFields) {
        const foundFile = formData.get(fieldName);
        if (foundFile instanceof File) {
          file = foundFile;
          break;
        }
      }

      // Extract multiple files
      let files: File[] = [];
      const filesFields = ['files', 'pdfs', 'documents'];
      
      for (const fieldName of filesFields) {
        const foundFiles = formData.getAll(fieldName);
        const validFiles = foundFiles.filter((f): f is File => f instanceof File);
        if (validFiles.length > 0) {
          files = validFiles;
          break;
        }
      }

      // If no single file found but files array has one item, use it as single file
      if (!file && files.length === 1) {
        file = files[0];
      }

      // Extract other parameters
      const params: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          params[key] = value.toString();
        }
      }

      // Validate files
      const allFiles = file ? [file, ...files.filter(f => f !== file)] : files;
      for (const f of allFiles) {
        await this.validateFile(f, { maxSize, allowedTypes });
      }

      // Check if file is required
      if (required && !file && files.length === 0) {
        throw new Error('No file provided. Please upload a PDF file.');
      }

      return { file, files, params };

    } catch (error) {
      console.error('Form data parsing error:', error);
      throw error;
    }
  }

  /**
   * Validate a single file
   */
  static async validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): Promise<void> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.DEFAULT_ALLOWED_TYPES
    } = options;

    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file object provided');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type with magic number check for PDFs
    const isValidType = await this.isValidFileType(file, allowedTypes);
    if (!isValidType) {
      throw new Error(`Unsupported or invalid file type. Expected: ${allowedTypes.join(', ')}`);
    }

    console.log(`✓ File validated: ${file.name} (${this.formatFileSize(file.size)})`);
  }

  /**
   * More robust file type validation, including magic number check for PDFs.
   */
  private static async isValidFileType(file: File, allowedTypes: string[]): Promise<boolean> {
    // For PDFs, perform a magic number check
    if (allowedTypes.includes('application/pdf') && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      try {
        const first5Bytes = await file.slice(0, 5).arrayBuffer();
        const uint8 = new Uint8Array(first5Bytes);
        const magicNumber = String.fromCharCode.apply(null, Array.from(uint8));
        
        if (magicNumber === '%PDF-') {
          return true; // It's a valid PDF
        } else {
          // If it was supposed to be a PDF but magic number doesn't match, it's invalid.
          throw new Error('File is not a valid PDF. Header signature is missing.');
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('File is not a valid PDF')) {
          throw e;
        }
        throw new Error(`Error reading file header for PDF validation: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    // Check MIME type for other file types
    if (file.type && allowedTypes.includes(file.type)) {
      return true;
    }

    // Check file extension as a fallback for non-PDF files
    const fileName = file.name.toLowerCase();
    for (const allowedType of allowedTypes) {
      if (allowedType !== 'application/pdf') {
        const extension = allowedType.split('/')[1];
        if (extension && fileName.endsWith(`.${extension}`)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Format file size for human reading
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(error: unknown, statusCode: number = 400) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API Error:', message);
    
    return Response.json(
      { 
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }

  /**
   * Create standardized success response for file operations
   */
  static createFileResponse(
    fileBuffer: ArrayBuffer | Uint8Array,
    filename: string,
    contentType: string = 'application/pdf',
    metadata: Record<string, string> = {}
  ) {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Expose-Headers': Object.keys(metadata).map(k => `X-${k}`).join(', '),
      ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`X-${k}`, v]))
    };

    return new Response(fileBuffer, { status: 200, headers });
  }

  /**
   * Validate parameter with type checking
   */
  static validateParam<T extends string>(
    value: string | undefined,
    validValues: T[],
    paramName: string,
    defaultValue?: T
  ): T {
    if (!value) {
      if (defaultValue) return defaultValue;
      throw new Error(`Missing required parameter: ${paramName}`);
    }

    if (!validValues.includes(value as T)) {
      throw new Error(`Invalid ${paramName}. Valid options: ${validValues.join(', ')}`);
    }

    return value as T;
  }

  /**
   * Validate numeric parameter
   */
  static validateNumericParam(
    value: string | undefined,
    min: number,
    max: number,
    paramName: string,
    defaultValue?: number
  ): number {
    if (!value) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing required parameter: ${paramName}`);
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      throw new Error(`${paramName} must be a valid number`);
    }

    if (num < min || num > max) {
      throw new Error(`${paramName} must be between ${min} and ${max}`);
    }

    return num;
  }

  /**
   * Validate boolean parameter
   */
  static validateBooleanParam(
    value: string | undefined,
    paramName: string,
    defaultValue: boolean = false
  ): boolean {
    if (!value) return defaultValue;
    
    return value === 'true' || value === '1';
  }
}
''