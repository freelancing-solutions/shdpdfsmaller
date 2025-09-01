import { NextRequest, NextResponse } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const compressionLevel = formData.get('compressionLevel') as string;
    const imageQuality = parseInt(formData.get('imageQuality') as string);

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

    // Validate compression level
    const validCompressionLevels = ['low', 'medium', 'high', 'maximum'];
    if (!validCompressionLevels.includes(compressionLevel)) {
      return NextResponse.json(
        { error: 'Invalid compression level' },
        { status: 400 }
      );
    }

    // Validate image quality
    if (isNaN(imageQuality) || imageQuality < 10 || imageQuality > 100) {
      return NextResponse.json(
        { error: 'Image quality must be between 10 and 100' },
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

    const compressionService = PDFCompressionService.getInstance();
    
    const options = {
      compressionLevel: compressionLevel as 'low' | 'medium' | 'high' | 'maximum',
      imageQuality,
    };

    const result = await compressionService.compressPDF(file, options);

    // Create response with compressed file
    const response = new NextResponse(result.compressedFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '_compressed.pdf')}"`,
        'X-Original-Size': result.originalSize.toString(),
        'X-Compressed-Size': result.compressedSize.toString(),
        'X-Compression-Ratio': result.compressionRatio.toString(),
        'X-Reduction-Percent': result.reductionPercent.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('Compression API error:', error);
    return NextResponse.json(
      { error: 'Failed to compress PDF' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Compression API',
    endpoints: {
      compress: 'POST /api/compress - Compress a PDF file',
    },
    supportedFormats: ['PDF'],
    maxFileSize: '50MB',
    compressionLevels: ['low', 'medium', 'high', 'maximum'],
  });
}