// app/api/convert/route.ts
import { NextRequest } from 'next/server';
import { PdfApiService } from '@/lib/api/pdf-services';
import { APIFileHandler } from '@/lib/api-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { file, params } = await APIFileHandler.parseFormData(request, {
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      required: true,
    });

    if (!file) throw new Error('No file provided for conversion');

    const format = APIFileHandler.validateParam(
      params.format,
      ['docx', 'txt', 'html', 'images'] as const,
      'format'
    );
    const quality = APIFileHandler.validateParam(
      params.quality,
      ['low', 'medium', 'high'] as const,
      'quality',
      'medium'
    );
    const preserveFormatting = APIFileHandler.validateBooleanParam(
      params.preserveFormatting,
      'preserveFormatting',
      true
    );
    const extractImages = APIFileHandler.validateBooleanParam(
      params.extractImages,
      'extractImages',
      false
    );

    const fd = new FormData();
    fd.append('file', file);
    fd.append('format', format);
    fd.append('quality', quality);
    fd.append('preserveFormatting', String(preserveFormatting));
    fd.append('extractImages', String(extractImages));

    /*  1️⃣  create job in Flask  */
    const jobId = await PdfApiService.createJob('/convert', fd);

    /*  2️⃣  return the envelope – browser will poll  */
    return Response.json(
      { status: 'success', message: 'Conversion job created', data: { job_id: jobId } },
      { status: 202 }
    );
  } catch (err) {
    return APIFileHandler.createErrorResponse(err, 400);
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
    success: true,
    message: 'PDF Conversion API',
    version: '1.0.0',
    endpoints: {
      convert: 'POST /api/convert - Convert PDF to other formats'
    },
    parameters: {
      file: 'PDF file to convert (File object)',
      format: 'Output format (docx|txt|html|images) - required',
      quality: 'Conversion quality (low|medium|high) - default: medium',
      preserveFormatting: 'Preserve document formatting (true|false) - default: true',
      extractImages: 'Extract images during conversion (true|false) - default: false'
    },
    supportedFormats: {
      input: ['PDF'],
      output: ['DOCX', 'TXT', 'HTML', 'Images (ZIP)']
    },
    limits: {
      maxFileSize: '50MB',
      supportedInputTypes: ['application/pdf']
    }
  });
}