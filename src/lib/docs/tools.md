# PDFSmaller API Documentation for Agentic Models (Next.js + TypeScript)

## Overview
PDFSmaller is a comprehensive PDF processing service with async job processing for compression, conversion, OCR, and AI tasks.

## Base URL
```typescript
const BASE_URL = 'https://api.pdfsmaller.site/api';
```

## TypeScript Interfaces
```typescript
interface JobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  result?: any;
  error?: string;
}

interface CompressionSettings {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number; // 10-100
}

interface ConversionOptions {
  preserveLayout?: boolean;
  extractTables?: boolean;
  extractImages?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

interface OCROptions {
  language?: string;
  quality?: 'fast' | 'balanced' | 'accurate';
  outputFormat?: 'searchable_pdf' | 'text' | 'json';
}

interface AIOptions {
  style?: 'concise' | 'detailed' | 'academic' | 'casual' | 'professional';
  maxLength?: 'short' | 'medium' | 'long';
  targetLanguage?: string; // ISO language code
}
```

## React Hook Example
```typescript
// hooks/usePdfProcessor.ts
import { useState, useCallback } from 'react';

export const usePdfProcessor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(async (endpoint: string, formData: FormData): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: JobResponse = await response.json();
      
      if (data.job_id) {
        return data.job_id;
      } else {
        throw new Error('No job ID received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkJobStatus = useCallback(async (jobId: string): Promise<JobResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    }
  }, []);

  const downloadResult = useCallback(async (jobId: string, filename: string): Promise<Blob> => {
    try {
      const response = await fetch(`${BASE_URL}/jobs/${jobId}/download`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      throw err;
    }
  }, []);

  return { loading, error, createJob, checkJobStatus, downloadResult };
};
```

## Service Functions Example
```typescript
// services/pdfService.ts
export class PdfService {
  private static readonly BASE_URL = 'https://api.pdfsmaller.site/api';

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

    const response = await fetch(`${this.BASE_URL}/compress`, {
      method: 'POST',
      body: formData,
    });

    const data: JobResponse = await response.json();
    return data.job_id;
  }

  static async convertPdf(
    file: File,
    targetFormat: 'docx' | 'xlsx' | 'txt' | 'html',
    options: ConversionOptions = {},
    clientJobId?: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    if (clientJobId) {
      formData.append('client_job_id', clientJobId);
    }

    const response = await fetch(`${this.BASE_URL}/convert/pdf-to-${targetFormat}`, {
      method: 'POST',
      body: formData,
    });

    const data: JobResponse = await response.json();
    return data.job_id;
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

    const response = await fetch(`${this.BASE_URL}/ocr/process`, {
      method: 'POST',
      body: formData,
    });

    const data: JobResponse = await response.json();
    return data.job_id;
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

    const data: JobResponse = await response.json();
    return data.job_id;
  }

  static async getJobStatus(jobId: string): Promise<JobResponse> {
    const response = await fetch(`${this.BASE_URL}/jobs/${jobId}`);
    return response.json();
  }

  static async downloadResult(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.BASE_URL}/jobs/${jobId}/download`);
    return response.blob();
  }
}
```

## React Component Example
```typescript
// components/PdfCompressor.tsx
'use client';

import { useState } from 'react';
import { PdfService } from '@/services/pdfService';
import { JobResponse, CompressionSettings } from '@/types/pdf';

export default function PdfCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) return;

    setLoading(true);
    try {
      const settings: CompressionSettings = {
        compressionLevel: 'medium',
        imageQuality: 80,
      };

      const newJobId = await PdfService.compressPdf(
        selectedFile, 
        settings,
        `compression_${Date.now()}`
      );
      
      setJobId(newJobId);
      await monitorJobStatus(newJobId);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const monitorJobStatus = async (jobId: string) => {
    const checkStatus = async () => {
      const status = await PdfService.getJobStatus(jobId);
      setJobStatus(status);

      if (status.status === 'processing' || status.status === 'pending') {
        setTimeout(() => checkStatus(), 2000); // Poll every 2 seconds
      } else if (status.status === 'completed') {
        // Auto-download when completed
        const blob = await PdfService.downloadResult(jobId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_${selectedFile?.name || 'document.pdf'}`;
        a.click();
      }
    };

    await checkStatus();
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <form onSubmit={handleFileUpload} className="space-y-4">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="w-full p-2 border rounded"
        />
        
        <button
          type="submit"
          disabled={!selectedFile || loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Compress PDF'}
        </button>
      </form>

      {jobStatus && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold">Job Status: {jobStatus.status}</h3>
          {jobStatus.message && <p>{jobStatus.message}</p>}
          {jobStatus.error && (
            <p className="text-red-500">Error: {jobStatus.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```
## Bulk Processing Example
```typescript
// services/bulkPdfService.ts
export class BulkPdfService {
  static async bulkCompress(files: File[]): Promise<string[]> {
    const jobIds: string[] = [];
    
    for (const file of files) {
      try {
        const jobId = await PdfService.compressPdf(
          file,
          { compressionLevel: 'medium', imageQuality: 80 },
          `bulk_${file.name}_${Date.now()}`
        );
        jobIds.push(jobId);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }
    
    return jobIds;
  }

  static async monitorBulkJobs(jobIds: string[]): Promise<Map<string, JobResponse>> {
    const statusMap = new Map<string, JobResponse>();
    
    await Promise.all(
      jobIds.map(async (jobId) => {
        const status = await PdfService.getJobStatus(jobId);
        statusMap.set(jobId, status);
      })
    );
    
    return statusMap;
  }
}
```

## Utility Functions
```typescript
// utils/jobMonitor.ts
export class JobMonitor {
  static async waitForCompletion(
    jobId: string, 
    interval: number = 2000,
    timeout: number = 300000 // 5 minutes
  ): Promise<JobResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await PdfService.getJobStatus(jobId);
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Job failed: ${status.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Job timeout exceeded');
  }

  static async downloadWhenReady(jobId: string, filename: string): Promise<void> {
    const status = await this.waitForCompletion(jobId);
    
    if (status.status === 'completed') {
      const blob = await PdfService.downloadResult(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
}
```

## Error Handling Wrapper
```typescript
// utils/errorHandler.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Usage example:
const jobId = await withRetry(() => 
  PdfService.compressPdf(file, settings)
);
