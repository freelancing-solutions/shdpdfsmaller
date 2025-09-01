import { NextRequest, NextResponse } from 'next/server';
import { PDFAIToolsService } from '@/lib/pdf-ai-tools';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tool = formData.get('tool') as string;
    const targetLanguage = formData.get('targetLanguage') as string;
    const maxLength = formData.get('maxLength') ? parseInt(formData.get('maxLength') as string) : undefined;
    const detailLevel = formData.get('detailLevel') as string;

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

    // Validate tool
    const validTools = ['summarize', 'translate', 'extract-keywords', 'analyze-sentiment', 'generate-questions', 'categorize'];
    if (!validTools.includes(tool)) {
      return NextResponse.json(
        { error: 'Invalid AI tool' },
        { status: 400 }
      );
    }

    // Validate detail level
    const validDetailLevels = ['basic', 'detailed', 'comprehensive'];
    if (!validDetailLevels.includes(detailLevel)) {
      return NextResponse.json(
        { error: 'Invalid detail level' },
        { status: 400 }
      );
    }

    // Validate target language for translation
    if (tool === 'translate') {
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
      if (!targetLanguage || !validLanguages.includes(targetLanguage)) {
        return NextResponse.json(
          { error: 'Invalid or missing target language for translation' },
          { status: 400 }
        );
      }
    }

    // Validate max length
    if (maxLength && (isNaN(maxLength) || maxLength < 100 || maxLength > 10000)) {
      return NextResponse.json(
        { error: 'Max length must be between 100 and 10000' },
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

    const aiService = PDFAIToolsService.getInstance();
    
    const options: any = {
      tool: tool as any,
      detailLevel: detailLevel as any,
    };

    if (targetLanguage) {
      options.targetLanguage = targetLanguage;
    }

    if (maxLength) {
      options.maxLength = maxLength;
    }

    const result = await aiService.processWithAI(file, options);

    // Create response with processed file
    const response = new NextResponse(result.processedFile, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', `_${tool}.txt`)}"`,
        'X-AI-Tool': result.settings.tool,
        'X-Processing-Time': result.processingTime.toString(),
        'X-Detail-Level': result.settings.detailLevel,
      },
    });

    return response;

  } catch (error) {
    console.error('AI Tools API error:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
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