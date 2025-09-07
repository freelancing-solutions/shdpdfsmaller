import { NextRequest } from 'next/server';
import { PDFOCRService } from '@/lib/pdf-ocr';
import { APIFileHandler } from '@/lib/api-utils';


export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { file, params } = await APIFileHandler.parseFormData(request);

    if (!file) {
      throw new Error('No file provided for OCR processing');
    }

    // Validate OCR parameters
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

    const ocrService = PDFOCRService.getInstance();
    
    const options = { language, outputFormat, preserveLayout, confidence };

    // Call the refactored OCR service
    const result = await ocrService.processOCR(file, options);

    // Determine content type and file extension
    const contentTypeMap = {
      txt: 'text/plain',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'searchable-pdf': 'application/pdf',
    };
    const fileExtensionMap = {
      txt: 'txt',
      pdf: 'pdf',
      docx: 'docx',
      'searchable-pdf': 'pdf',
    };

    const contentType = contentTypeMap[outputFormat];
    const fileExtension = fileExtensionMap[outputFormat];
    const filename = file.name.replace('.pdf', `_ocr.${fileExtension}`);

    const metadata = {
      'Original-Size': result.originalSize.toString(),
      'Processed-Size': result.processedSize.toString(),
      'OCR-Confidence': result.confidence.toString(),
      'Processing-Time': result.processingTime.toString(),
      'Output-Format': outputFormat,
    };

    return APIFileHandler.createFileResponse(
      new Uint8Array(await result.processedFile.arrayBuffer()),
      filename,
      contentType,
      metadata
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


