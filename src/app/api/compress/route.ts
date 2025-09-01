import { NextRequest, NextResponse } from 'next/server';
import { PDFCompressionService } from '@/lib/pdf-compression';

export const runtime = 'edge';

// Helper function to validate compression options
function validateCompressionOptions(compressionLevel: string, imageQuality: number) {
  const validCompressionLevels = ['low', 'medium', 'high', 'maximum'];
  if (!validCompressionLevels.includes(compressionLevel)) {
    throw new Error('Invalid compression level');
  }

  if (isNaN(imageQuality) || imageQuality < 10 || imageQuality > 100) {
    throw new Error('Image quality must be between 10 and 100');
  }

  return {
    compressionLevel: compressionLevel as 'low' | 'medium' | 'high' | 'maximum',
    imageQuality,
  };
}

// Helper function to validate file
function validateFile(file: File | null, maxSize: number = 50 * 1024 * 1024) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit');
  }

  return file;
}

// Single file compression handler
async function handleSingleCompression(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Debug: Log all form data entries
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }

    const file = formData.get('file') as File;
    const compressionLevel = formData.get('compressionLevel') as string;
    const imageQuality = formData.get('imageQuality') as string;

    console.log('Processing single file:', file?.name, file?.size);

    // Validate inputs
    const validatedFile = validateFile(file);
    const imageQualityNum = parseInt(imageQuality);
    const options = validateCompressionOptions(compressionLevel, imageQualityNum);

    // Compress the file
    const compressionService = PDFCompressionService.getInstance();
    const result = await compressionService.compressPDF(validatedFile, options);

    console.log('Compression successful:', {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      reduction: result.reductionPercent + '%'
    });

    // Return compressed file
    return new NextResponse(result.compressedFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${validatedFile.name.replace('.pdf', '_compressed.pdf')}"`,
        'X-Original-Size': result.originalSize.toString(),
        'X-Compressed-Size': result.compressedSize.toString(),
        'X-Compression-Ratio': result.compressionRatio.toString(),
        'X-Reduction-Percent': result.reductionPercent.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Single compression error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compress PDF' },
      { status: 400 }
    );
  }
}

// Bulk file compression handler
async function handleBulkCompression(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Debug: Log all form data entries
    console.log('FormData entries (bulk):');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }

    const files = formData.getAll('files') as File[];
    const compressionLevel = formData.get('compressionLevel') as string;
    const imageQuality = formData.get('imageQuality') as string;

    console.log('Processing bulk files:', files.length, 'files');

    // Validate inputs
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const imageQualityNum = parseInt(imageQuality);
    const options = validateCompressionOptions(compressionLevel, imageQualityNum);

    // Validate all files
    const validatedFiles = files.map(file => validateFile(file));

    // Compress all files
    const compressionService = PDFCompressionService.getInstance();
    const compressionPromises = validatedFiles.map(file => 
      compressionService.compressPDF(file, options)
    );

    const results = await Promise.all(compressionPromises);

    console.log('Bulk compression successful:', {
      totalFiles: results.length,
      files: results.map((result, index) => ({
        name: validatedFiles[index].name,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reduction: result.reductionPercent + '%'
      }))
    });

    // For now, return the first file as placeholder
    // You'll need to implement proper zip functionality
    const firstResult = results[0];
    const firstFile = validatedFiles[0];

    return new NextResponse(firstResult.compressedFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${firstFile.name.replace('.pdf', '_compressed.pdf')}"`,
        'X-Original-Size': firstResult.originalSize.toString(),
        'X-Compressed-Size': firstResult.compressedSize.toString(),
        'X-Compression-Ratio': firstResult.compressionRatio.toString(),
        'X-Reduction-Percent': firstResult.reductionPercent.toString(),
        'X-Total-Files': files.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Bulk compression error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compress files' },
      { status: 400 }
    );
  }
}

// Main POST handler - routes to single or bulk compression
export async function POST(request: NextRequest) {
  try {
    // First, clone the request to read form data without consuming it
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    
    const hasFiles = formData.has('files');
    const hasFile = formData.has('file');

    console.log('Request analysis:', { hasFiles, hasFile });

    // Determine if this is a bulk or single request
    if (hasFiles) {
      console.log('Routing to bulk compression');
      return handleBulkCompression(request);
    } else if (hasFile) {
      console.log('Routing to single compression');
      return handleSingleCompression(request);
    } else {
      console.error('No file or files field found in request');
      return NextResponse.json(
        { error: 'No file or files provided. Use "file" for single or "files" for multiple.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Compression API routing error:', error);
    return NextResponse.json(
      { error: 'Failed to process compression request' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// GET handler for API information
export async function GET() {
  return NextResponse.json({
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