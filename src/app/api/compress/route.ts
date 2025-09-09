// this is the api service it calls the lib tool which calls an api handles compression then returns the result to this file.
import { NextRequest } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';
import { APIFileHandler } from '@/lib/api-utils';
import { PdfApiService } from '@/lib/api/pdf-services';

export const runtime = 'edge';

// Single file compression handler
async function handleSingleCompression(file: File, params: Record<string, string>) {
  try {
    const compressionLevel = APIFileHandler.validateParam(
      params.compressionLevel,
      ['low', 'medium', 'high', 'maximum'],
      'compressionLevel',
      'medium'
    );
    const imageQuality = APIFileHandler.validateNumericParam(
      params.imageQuality,
      10,
      100,
      'imageQuality',
      75
    );

    /*  ----  NEW: job-based flow  ----  */
    const fd = new FormData();
    fd.append('file', file);
    fd.append('compressionLevel', compressionLevel);
    fd.append('imageQuality', String(imageQuality));

    // 1️⃣  create job in Flask
    const jobId = await PdfApiService.createJob('/compress', fd);

    // 2️⃣  return envelope – browser will poll
    return Response.json(
      { status: 'success', message: 'Compression job created', data: { job_id: jobId } },
      { status: 202 }
    );
  } catch (error) {
    console.error('Single compression error:', error);
    return APIFileHandler.createErrorResponse(error);
  }
}

// Bulk file compression handler
async function handleBulkCompression(files: File[], params: Record<string, string>) {
  try {
    const compressionLevel = APIFileHandler.validateParam(
      params.compressionLevel,
      ['low', 'medium', 'high', 'maximum'],
      'compressionLevel',
      'medium'
    );
    const imageQuality = APIFileHandler.validateNumericParam(
      params.imageQuality,
      10,
      100,
      'imageQuality',
      75
    );

    /*  ----  fire one job per file  ----  */
    const jobIds: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('compressionLevel', compressionLevel);
      fd.append('imageQuality', String(imageQuality));
      const id = await PdfApiService.createJob('/compress', fd);
      jobIds.push(id);
    }

    // return array of job-ids – UI can poll them in parallel
    return Response.json(
      { status: 'success', message: 'Bulk compression jobs created', data: { job_ids: jobIds } },
      { status: 202 }
    );
  } catch (error) {
    console.error('Bulk compression error:', error);
    return APIFileHandler.createErrorResponse(error);
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const { file, files, params } = await APIFileHandler.parseFormData(request);

    if (files && files.length > 1) {
      console.log('Routing to bulk compression');
      return handleBulkCompression(files, params);
    } else if (file) {
      console.log('Routing to single compression');
      return handleSingleCompression(file, params);
    } else {
      return APIFileHandler.createErrorResponse(new Error('No file or files provided. Use "file" for single or "files" for multiple.'), 400);
    }

  } catch (error) {
    console.error('Compression API routing error:', error);
    return APIFileHandler.createErrorResponse(error, 500);
  }
}

// GET handler for API information
export async function GET() {
  return Response.json({
    message: 'PDF Compression API',
    endpoints: {
      single: 'POST /api/compress - Compress a single PDF file (use "file" field)',
      bulk: 'POST /api/compress - Compress multiple PDF files (use "files" array field)',
    },
    parameters: {
      compressionLevel: 'low | medium | high | maximum',
      imageQuality: '10-100',
    },
    supportedFormats: ['PDF'],
    maxFileSize: '50MB',
    maxBulkFiles: 10,
  });
}
