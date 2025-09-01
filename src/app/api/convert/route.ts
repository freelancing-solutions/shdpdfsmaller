import { NextRequest, NextResponse } from 'next/server';
import { PDFConversionService } from '@/lib/pdf-conversion';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;
    const quality = formData.get('quality') as string;
    const preserveFormatting = formData.get('preserveFormatting') === 'true';
    const extractImages = formData.get('extractImages') === 'true';

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

    // Validate conversion format
    const validFormats = ['docx', 'txt', 'html', 'images'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid conversion format' },
        { status: 400 }
      );
    }

    // Validate quality
    const validQualities = ['low', 'medium', 'high'];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: 'Invalid quality setting' },
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

    const conversionService = PDFConversionService.getInstance();
    
    const options = {
      format: format as 'docx' | 'txt' | 'html' | 'images',
      quality: quality as 'low' | 'medium' | 'high',
      preserveFormatting,
      extractImages,
    };

    const result = await conversionService.convertPDF(file, options);

    // Determine content type based on format
    let contentType: string;
    let fileExtension: string;
    
    switch (format) {
      case 'txt':
        contentType = 'text/plain';
        fileExtension = 'txt';
        break;
      case 'html':
        contentType = 'text/html';
        fileExtension = 'html';
        break;
      case 'images':
        contentType = 'text/html';
        fileExtension = 'html';
        break;
      case 'docx':
      default:
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
    }

    // Create response with converted file
    const response = new NextResponse(result.convertedFile, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', `.${fileExtension}`)}"`,
        'X-Original-Size': result.originalSize.toString(),
        'X-Converted-Size': result.convertedSize.toString(),
        'X-Conversion-Format': result.format,
        'X-Processing-Time': result.processingTime.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('Conversion API error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Conversion API',
    endpoints: {
      convert: 'POST /api/convert - Convert a PDF file',
    },
    supportedFormats: ['docx', 'txt', 'html', 'images'],
    supportedQualities: ['low', 'medium', 'high'],
    maxFileSize: '50MB',
  });
}