// app/api/convert/route.ts
import { NextRequest } from 'next/server';
import { PDFConversionService } from '@/lib/pdf-conversion';
import { APIFileHandler } from '@/lib/api-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('=== CONVERSION API CALLED ===');

    // Parse form data using standardized handler
    const { file, params } = await APIFileHandler.parseFormData(request, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf'],
      required: true
    });

    if (!file) {
      throw new Error('No file provided for conversion');
    }

    // Validate conversion parameters
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

    console.log('Validated parameters:', {
      file: `${file.name} (${APIFileHandler.formatFileSize(file.size)})`,
      format,
      quality,
      preserveFormatting,
      extractImages
    });

    // Initialize conversion service
    const conversionService = PDFConversionService.getInstance();
    
    const conversionOptions = {
      format,
      quality,
      preserveFormatting,
      extractImages
    };

    console.log('Starting conversion with options:', conversionOptions);

    const result = await conversionService.convertPDF(file, conversionOptions);

    console.log('Conversion successful:', {
      originalSize: APIFileHandler.formatFileSize(result.originalSize),
      convertedSize: APIFileHandler.formatFileSize(result.convertedSize),
      format: result.format,
      processingTime: `${result.processingTime}ms`
    });

    // Determine content type and file extension
    const contentTypeMap = {
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      html: 'text/html',
      images: 'application/zip'
    };

    const fileExtensionMap = {
      docx: 'docx',
      txt: 'txt', 
      html: 'html',
      images: 'zip'
    };

    const contentType = contentTypeMap[format];
    const extension = fileExtensionMap[format];
    const filename = file.name.replace('.pdf', `.${extension}`);

    const metadata = {
      'Original-Size': result.originalSize.toString(),
      'Converted-Size': result.convertedSize.toString(),
      'Conversion-Format': result.format,
      'Processing-Time': result.processingTime.toString(),
      'Preserve-Formatting': preserveFormatting.toString(),
      'Extract-Images': extractImages.toString()
    };

    return APIFileHandler.createFileResponse(
      await result.convertedFile.arrayBuffer(),
      filename,
      contentType,
      metadata
    );

  } catch (error) {
    return APIFileHandler.createErrorResponse(error, 400);
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