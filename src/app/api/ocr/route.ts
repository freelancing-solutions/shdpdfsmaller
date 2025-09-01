import { NextRequest, NextResponse } from 'next/server';
import { PDFOCRService } from '@/lib/pdf-ocr';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const outputFormat = formData.get('outputFormat') as string;
    const preserveLayout = formData.get('preserveLayout') === 'true';
    const confidence = parseInt(formData.get('confidence') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate language
    const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language setting' },
        { status: 400 }
      );
    }

    // Validate output format
    const validFormats = ['txt', 'pdf', 'docx', 'searchable-pdf'];
    if (!validFormats.includes(outputFormat)) {
      return NextResponse.json(
        { error: 'Invalid output format' },
        { status: 400 }
      );
    }

    // Validate confidence
    if (isNaN(confidence) || confidence < 50 || confidence > 100) {
      return NextResponse.json(
        { error: 'Confidence must be between 50 and 100' },
        { status: 400 }
      );
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const ocrService = PDFOCRService.getInstance();
    
    const options = {
      language: language as 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko',
      outputFormat: outputFormat as 'txt' | 'pdf' | 'docx' | 'searchable-pdf',
      preserveLayout,
      confidence,
    };

    const result = await ocrService.processOCR(file, options);

    // Determine content type based on format
    let contentType: string;
    let fileExtension: string;
    
    switch (outputFormat) {
      case 'txt':
        contentType = 'text/plain';
        fileExtension = 'txt';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      case 'pdf':
      case 'searchable-pdf':
      default:
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
    }

    // Create response with processed file
    const response = new NextResponse(result.processedFile, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', `_ocr.${fileExtension}`)}"`,
        'X-Original-Size': result.originalSize.toString(),
        'X-Processed-Size': result.processedSize.toString(),
        'X-OCR-Confidence': result.confidence.toString(),
        'X-Processing-Time': result.processingTime.toString(),
        'X-Output-Format': result.outputFormat,
      },
    });

    return response;

  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'Failed to process OCR' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
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