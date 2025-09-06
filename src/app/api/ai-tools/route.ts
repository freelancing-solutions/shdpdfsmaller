
import { NextRequest } from 'next/server';
import { PDFAIToolsService } from '@/lib/pdf-ai-tools';
import { APIFileHandler } from '@/lib/api-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { file, params } = await APIFileHandler.parseFormData(request);

    if (!file) {
      throw new Error('No file provided for AI processing');
    }

    // Validate AI tool parameters
    const tool = APIFileHandler.validateParam(
      params.tool,
      ['summarize', 'translate', 'extract-keywords', 'analyze-sentiment', 'generate-questions', 'categorize'] as const,
      'tool'
    );
    const detailLevel = APIFileHandler.validateParam(
      params.detailLevel,
      ['basic', 'detailed', 'comprehensive'] as const,
      'detailLevel',
      'basic'
    );
    const maxLength = APIFileHandler.validateNumericParam(
      params.maxLength,
      100,
      10000,
      'maxLength',
      1000
    );

    let targetLanguage: string | undefined;
    if (tool === 'translate') {
      targetLanguage = APIFileHandler.validateParam(
        params.targetLanguage,
        ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'] as const,
        'targetLanguage'
      );
    }

    const aiService = PDFAIToolsService.getInstance();
    
    const options: any = { tool, detailLevel, maxLength };
    if (targetLanguage) {
      options.targetLanguage = targetLanguage;
    }

    const result = await aiService.processWithAI(file, options);

    // The result from AI tools is a Blob, so we convert it to text
    const textContent = await result.processedFile.text();
    const textBuffer = new TextEncoder().encode(textContent);

    const filename = file.name.replace('.pdf', `_${tool}.txt`);

    const metadata = {
      'AI-Tool': result.settings.tool,
      'Processing-Time': result.processingTime.toString(),
      'Detail-Level': result.settings.detailLevel,
    };

    return APIFileHandler.createFileResponse(
      textBuffer,
      filename,
      'text/plain',
      metadata
    );

  } catch (error) {
    console.error('AI Tools API error:', error);
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
    message: 'PDF AI Tools API',
    endpoints: {
      'ai-tools': 'POST /api/ai-tools - Process PDF with AI tools',
    },
    supportedTools: [
      'summarize',
      'translate', 
      'extract-keywords',
      'analyze-sentiment',
      'generate-questions',
      'categorize'
    ],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
    detailLevels: ['basic', 'detailed', 'comprehensive'],
    maxFileSize: '50MB',
  });
}
