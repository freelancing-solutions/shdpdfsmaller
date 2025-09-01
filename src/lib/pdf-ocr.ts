import { PDFDocument } from 'pdf-lib';

export interface OCROptions {
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
  outputFormat: 'txt' | 'pdf' | 'docx' | 'searchable-pdf';
  preserveLayout: boolean;
  confidence: number;
}

export interface OCRResult {
  processedFile: Blob;
  originalSize: number;
  processedSize: number;
  extractedText: string;
  confidence: number;
  processingTime: number;
  settings: OCROptions;
}

export class PDFOCRService {
  private static instance: PDFOCRService;

  static getInstance(): PDFOCRService {
    if (!PDFOCRService.instance) {
      PDFOCRService.instance = new PDFOCRService();
    }
    return PDFOCRService.instance;
  }

  async processOCR(file: File, options: OCROptions): Promise<OCRResult> {
    try {
      const startTime = Date.now();
      const originalSize = file.size;
      
      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Extract text from PDF (simulated OCR)
      const { extractedText, confidence } = await this.extractTextWithOCR(pdfDoc, options);
      
      let processedBlob: Blob;
      
      switch (options.outputFormat) {
        case 'txt':
          processedBlob = new Blob([extractedText], { type: 'text/plain' });
          break;
        case 'docx':
          processedBlob = await this.createDocxFromText(extractedText);
          break;
        case 'searchable-pdf':
          processedBlob = await this.createSearchablePDF(pdfDoc, extractedText);
          break;
        case 'pdf':
        default:
          processedBlob = await this.createAnnotatedPDF(pdfDoc, extractedText);
          break;
      }
      
      const processingTime = Date.now() - startTime;
      const processedSize = processedBlob.size;
      
      return {
        processedFile: processedBlob,
        originalSize,
        processedSize,
        extractedText,
        confidence,
        processingTime,
        settings: options,
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`Failed to process OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextWithOCR(pdfDoc: PDFDocument, options: OCROptions): Promise<{
    extractedText: string;
    confidence: number;
  }> {
    try {
      const pages = pdfDoc.getPages();
      let fullText = '';
      let totalConfidence = 0;
      let textBlocks = 0;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { text, confidence } = await this.processPageWithOCR(page, i, options);
        
        fullText += `Page ${i + 1}:\n${text}\n\n`;
        totalConfidence += confidence;
        textBlocks++;
      }
      
      const averageConfidence = textBlocks > 0 ? totalConfidence / textBlocks : 0;
      
      return {
        extractedText: fullText.trim(),
        confidence: Math.min(averageConfidence, 100),
      };
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text with OCR');
    }
  }

  private async processPageWithOCR(page: any, pageIndex: number, options: OCROptions): Promise<{
    text: string;
    confidence: number;
  }> {
    // This is a simulated OCR implementation
    // In a real application, you would use Tesseract.js or similar OCR library
    
    const simulatedTexts = [
      'This is sample extracted text from page ' + (pageIndex + 1) + '. ',
      'The OCR process has identified various text elements on this page. ',
      'Document processing includes layout analysis and character recognition. ',
      'Advanced OCR engines can handle multiple languages and formats. ',
      'Text extraction quality depends on image resolution and clarity.'
    ];
    
    const baseConfidence = 85 + Math.random() * 10; // 85-95% base confidence
    const languageBonus = this.getLanguageBonus(options.language);
    const qualityMultiplier = options.confidence / 100;
    
    const finalConfidence = Math.min(baseConfidence + languageBonus, 100) * qualityMultiplier;
    
    const selectedTexts = simulatedTexts.slice(0, 2 + Math.floor(Math.random() * 3));
    const text = selectedTexts.join('');
    
    return {
      text,
      confidence: finalConfidence,
    };
  }

  private getLanguageBonus(language: string): number {
    const bonuses: Record<string, number> = {
      'en': 5,
      'es': 3,
      'fr': 3,
      'de': 4,
      'it': 3,
      'pt': 2,
      'ru': 1,
      'zh': 0,
      'ja': 0,
      'ko': 0,
    };
    return bonuses[language] || 0;
  }

  private async createDocxFromText(text: string): Promise<Blob> {
    // This is a simplified implementation
    // In a real application, you would use a library like docx
    const docxContent = `Document converted via OCR\n\n${text}`;
    
    return new Blob([docxContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }

  private async createSearchablePDF(pdfDoc: PDFDocument, text: string): Promise<Blob> {
    try {
      // Create a new PDF with the extracted text as searchable content
      const newPdfDoc = await PDFDocument.create();
      
      // Copy pages from original PDF
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
      
      // Add text layer (simplified)
      const textPage = newPdfDoc.addPage();
      const { width, height } = textPage.getSize();
      
      // Add extracted text as invisible layer for searchability
      const textContent = text.substring(0, 5000); // Limit text length
      textPage.drawText(textContent, {
        x: 50,
        y: height - 50,
        size: 1, // Very small, essentially invisible
        opacity: 0.01, // Nearly transparent
        color: this.rgbToHex(255, 255, 255),
      });
      
      const pdfBytes = await newPdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Searchable PDF creation failed:', error);
      throw new Error('Failed to create searchable PDF');
    }
  }

  private async createAnnotatedPDF(pdfDoc: PDFDocument, text: string): Promise<Blob> {
    try {
      // Create a copy of the original PDF with OCR annotations
      const newPdfDoc = await PDFDocument.create();
      
      // Copy pages from original PDF
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
      
      // Add OCR summary page
      const summaryPage = newPdfDoc.addPage();
      const { width, height } = summaryPage.getSize();
      
      summaryPage.drawText('OCR Processing Summary', {
        x: width / 2 - 100,
        y: height - 50,
        size: 20,
        color: this.rgbToHex(0, 0, 0),
      });
      
      summaryPage.drawText(`Total Pages Processed: ${pages.length}`, {
        x: 50,
        y: height - 100,
        size: 12,
        color: this.rgbToHex(0, 0, 0),
      });
      
      summaryPage.drawText('Extracted Text Sample:', {
        x: 50,
        y: height - 130,
        size: 12,
        color: this.rgbToHex(0, 0, 0),
      });
      
      // Add sample of extracted text
      const sampleText = text.substring(0, 1000);
      const lines = sampleText.split('\n');
      let yPosition = height - 160;
      
      for (const line of lines) {
        if (yPosition < 50) break; // Stop if we run out of space
        
        summaryPage.drawText(line.substring(0, 80), {
          x: 50,
          y: yPosition,
          size: 10,
          color: this.rgbToHex(64, 64, 64),
        });
        
        yPosition -= 15;
      }
      
      const pdfBytes = await newPdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Annotated PDF creation failed:', error);
      throw new Error('Failed to create annotated PDF');
    }
  }

  private rgbToHex(r: number, g: number, b: number): any {
    // Convert RGB to PDFLib color format
    return {
      type: 'RGB',
      red: r / 255,
      green: g / 255,
      blue: b / 255,
    };
  }

  async analyzePDF(file: File): Promise<{
    pageCount: number;
    size: number;
    estimatedProcessingTime: number;
    recommendedSettings: OCROptions;
    textDensity: 'low' | 'medium' | 'high';
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const pageCount = pdfDoc.getPageCount();
      const size = file.size;
      
      // Estimate processing time (rough calculation)
      const estimatedTime = pageCount * 2 + (size / (1024 * 1024)) * 0.5; // seconds
      
      // Determine text density based on file characteristics
      let textDensity: 'low' | 'medium' | 'high' = 'medium';
      if (size / pageCount > 1024 * 1024) { // > 1MB per page
        textDensity = 'high';
      } else if (size / pageCount < 100 * 1024) { // < 100KB per page
        textDensity = 'low';
      }
      
      // Recommended settings based on analysis
      const recommendedSettings: OCROptions = {
        language: 'en',
        outputFormat: textDensity === 'high' ? 'searchable-pdf' : 'txt',
        preserveLayout: textDensity !== 'low',
        confidence: textDensity === 'high' ? 95 : 85,
      };
      
      return {
        pageCount,
        size,
        estimatedProcessingTime: Math.round(estimatedTime),
        recommendedSettings,
        textDensity,
      };
    } catch (error) {
      console.error('PDF analysis failed:', error);
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchProcess(files: File[], options: OCROptions): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processOCR(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process OCR for ${file.name}:`, error);
        // Add a failed result
        results.push({
          processedFile: new Blob([]),
          originalSize: file.size,
          processedSize: 0,
          extractedText: '',
          confidence: 0,
          processingTime: 0,
          settings: options,
        });
      }
    }
    
    return results;
  }
}