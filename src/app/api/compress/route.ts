
import { NextRequest } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';
import { APIFileHandler } from '@/lib/api-utils';

export const runtime = 'edge';

// Single file compression handler
async function handleSingleCompression(file: File, params: Record<string, string>) {
  try {
    // Validate options
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

    // Compress the file
    const compressionService = PDFCompressionService.getInstance();
    const result = await compressionService.compressPDF(file, { compressionLevel, imageQuality });

    console.log('Compression successful:', {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      reduction: result.reductionPercent + '%'
    });

    // Return compressed file
    return APIFileHandler.createFileResponse(
      result.compressedFile,
      file.name.replace('.pdf', '_compressed.pdf'),
      'application/pdf',
      {
        'Original-Size': result.originalSize.toString(),
        'Compressed-Size': result.compressedSize.toString(),
        'Compression-Ratio': result.compressionRatio.toString(),
        'Reduction-Percent': result.reductionPercent.toString(),
      }
    );

  } catch (error) {
    console.error('Single compression error:', error);
    return APIFileHandler.createErrorResponse(error);
  }
}

// Bulk file compression handler
async function handleBulkCompression(files: File[], params: Record<string, string>) {
  try {
    // Validate options
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

    // Compress all files
    const compressionService = PDFCompressionService.getInstance();
    const compressionPromises = files.map(file => 
      compressionService.compressPDF(file, { compressionLevel, imageQuality })
    );

    const results = await Promise.all(compressionPromises);

    console.log('Bulk compression successful:', {
      totalFiles: results.length,
    });

    // For now, return the first file as placeholder
    // TODO: Implement proper zip functionality for bulk downloads
    const firstResult = results[0];
    const firstFile = files[0];

    return APIFileHandler.createFileResponse(
      firstResult.compressedFile,
      firstFile.name.replace('.pdf', '_compressed.pdf'),
      'application/pdf',
      {
        'Original-Size': firstResult.originalSize.toString(),
        'Compressed-Size': firstResult.compressedSize.toString(),
        'Compression-Ratio': firstResult.compressionRatio.toString(),
        'Reduction-Percent': firstResult.reductionPercent.toString(),
        'Total-Files': files.length.toString(),
      }
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
