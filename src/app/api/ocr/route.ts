import { NextRequest } from 'next/server';
import { PDFOCRService } from '@/lib/pdf-ocr';
import { APIFileHandler } from '@/lib/api-utils';
import { PdfApiService } from '@/lib/api/pdf-services';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    /*  ----  reuse your existing parse + validation  ----  */
    const { file, params } = await APIFileHandler.parseFormData(request);

    if (!file) throw new Error('No file provided for OCR processing');

    const language = APIFileHandler.validateParam(
      params.language,
      ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'] as const,
      'language'
    );
    const outputFormat = APIFileHandler.validateParam(
      params.outputFormat,
      ['txt', 'pdf', 'docx', 'searchable-pdf'] as const,
      'outputFormat'
    );
    const preserveLayout = APIFileHandler.validateBooleanParam(
      params.preserveLayout,
      'preserveLayout',
      false
    );
    const confidence = APIFileHandler.validateNumericParam(
      params.confidence,
      50,
      100,
      'confidence',
      95
    );

    /*  ----  NEW: job-based flow  ----  */
    const fd = new FormData();
    fd.append('file', file);
    fd.append('language', language);
    fd.append('outputFormat', outputFormat);
    fd.append('preserveLayout', String(preserveLayout));
    fd.append('confidence', String(confidence));

    // 1️⃣  create job in Flask
    const jobId = await PdfApiService.createJob('/ocr', fd);

    // 2️⃣  return envelope – browser will poll
    return Response.json(
      { status: 'success', message: 'OCR job created', data: { job_id: jobId } },
      { status: 202 }
    );
  } catch (error) {
    console.error('OCR API error:', error);
    return APIFileHandler.createErrorResponse(error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  return Response.json({
    message: 'PDF OCR API',
    endpoints: {
      ocr: 'POST /api/ocr - Process OCR on a PDF file',
    },
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
    supportedFormats: ['txt', 'pdf', 'docx', 'searchable-pdf'],
    confidenceRange: '50-100',
    maxFileSize: '50MB',
  });
}


