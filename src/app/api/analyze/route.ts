
import { NextRequest } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';
import { APIFileHandler } from '@/lib/api-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { file } = await APIFileHandler.parseFormData(request);

    if (!file) {
      throw new Error('No file provided for analysis');
    }

    const compressionService = PDFCompressionService.getInstance();
    const analysis = await compressionService.analyzePDF(file);

    const responseData = {
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
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Analysis API error:', error);
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
    message: 'PDF Analysis API',
    endpoints: {
      analyze: 'POST /api/analyze - Analyze a PDF file for compression potential',
    },
    supportedFormats: ['PDF'],
    maxFileSize: '50MB',
  });
}
