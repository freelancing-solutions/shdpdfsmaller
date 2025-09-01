import { NextRequest, NextResponse } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

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

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const compressionService = PDFCompressionService.getInstance();
    const analysis = await compressionService.analyzePDF(file);

    return NextResponse.json({
      success: true,
      analysis: {
        fileName: file.name,
        fileSize: analysis.size,
        pageCount: analysis.pageCount,
        compressionPotential: analysis.compressionPotential,
        recommendedSettings: analysis.recommendedSettings,
        estimatedCompression: {
          estimatedSize: Math.round(analysis.size * (1 - analysis.compressionPotential)),
          estimatedReduction: Math.round(analysis.compressionPotential * 100),
        },
      },
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Analysis API',
    endpoints: {
      analyze: 'POST /api/analyze - Analyze a PDF file for compression potential',
    },
    supportedFormats: ['PDF'],
    maxFileSize: '50MB',
  });
}