// lib/api/job-monitor.ts

import { PdfApiService, JobResponse } from './pdf-services';

export interface JobMonitorOptions {
  checkInterval?: number;
  timeout?: number;
  onProgress?: (status: JobResponse) => void;
  onError?: (error: Error) => void;
}

export class JobMonitor {
  static async executeWithJob<T>(
    createJob: () => Promise<string>,
    processResult: (jobResponse: JobResponse) => Promise<T>,
    options: JobMonitorOptions = {}
  ): Promise<T> {
    const {
      checkInterval = 2000,
      timeout = 30000,
      onProgress,
      onError
    } = options;

    let jobId: string;
    
    try {
      jobId = await createJob();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create job');
      onError?.(err);
      throw err;
    }

    try {
      const jobResponse = await PdfApiService.waitForJobCompletion(
        jobId,
        checkInterval,
        timeout
      );

      onProgress?.(jobResponse);
      return await processResult(jobResponse);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Job execution failed');
      onError?.(err);
      throw err;
    }
  }

  static async executeWithDownload(
    createJob: () => Promise<string>,
    options: JobMonitorOptions = {}
  ): Promise<Blob> {
    return this.executeWithJob(
      createJob,
      async (jobResponse) => {
        if (jobResponse.status === 'completed') {
          return await PdfApiService.downloadResult(jobResponse.job_id);
        }
        throw new Error(`Job not completed: ${jobResponse.status}`);
      },
      options
    );
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    shouldRetry: (error: Error) => boolean = (error) => 
      error.message.includes('timeout') || error.message.includes('network')
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries && shouldRetry(lastError)) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        break;
      }
    }
    
    throw lastError ?? new Error('Operation failed after maximum retries');
  }
}