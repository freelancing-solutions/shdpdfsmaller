import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import JSZip from 'jszip';

export interface ConversionOptions {
  format: 'docx' | 'txt' | 'html' | 'images';
  quality: 'low' | 'medium' | 'high';
  preserveFormatting: boolean;
  extractImages: boolean;
}

export interface ConversionResult {
  convertedFile: Blob;
  originalSize: number;
  convertedSize: number;
  format: string;
  processingTime: number;
  settings: ConversionOptions;
}

export class PDFConversionService {
  private static instance: PDFConversionService;

  static getInstance(): PDFConversionService {
    if (!PDFConversionService.instance) {
      PDFConversionService.instance = new PDFConversionService();
    }
    return PDFConversionService.instance;
  }

  async convertPDF(file: File, options: ConversionOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const originalSize = file.size;
    
    try {
      // Load the PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Convert based on format
      const convertedFile = await this.performConversion(pdfDoc, options, file.name);
      
      return {
        convertedFile,
        originalSize,
        convertedSize: convertedFile.size,
        format: options.format,
        processingTime: Date.now() - startTime,
        settings: options,
      };
    } catch (error) {
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async performConversion(pdfDoc: PDFDocument, options: ConversionOptions, originalFileName: string): Promise<Blob> {
    switch (options.format) {
      case 'txt':
        return await this.convertToText(pdfDoc, options);
      case 'html':
        return await this.convertToHTML(pdfDoc, options);
      case 'docx':
        return await this.convertToDocx(pdfDoc, options);
      case 'images':
        return await this.extractImages(pdfDoc, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private async convertToText(pdfDoc: PDFDocument, options: ConversionOptions): Promise<Blob> {
    try {
      const pages = pdfDoc.getPages();
      let textContent = '';
      
      // Extract basic text information from PDF structure
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        textContent += `Page ${i + 1}:\n`;
        textContent += `Dimensions: ${Math.round(width)} x ${Math.round(height)} points\n`;
        textContent += `This PDF contains ${pages.length} page(s) with various content.\n`;
        textContent += `In a full implementation, this would extract the actual text content `;
        textContent += `from the PDF using advanced text extraction libraries.\n\n`;
        
        // Try to extract any text that might be accessible
        try {
          // This is a simplified approach - in a real implementation,
          // you would use a proper PDF text extraction library
          const pageText = `[Text content would be extracted here using libraries like pdf-parse or pdfjs-dist]`;
          textContent += `Content: ${pageText}\n\n`;
        } catch (textError) {
          textContent += `[Text extraction not available in this simplified implementation]\n\n`;
        }
      }
      
      return new Blob([textContent], { type: 'text/plain' });
    } catch (error) {
      console.error('Text conversion error:', error);
      // Fallback to basic content
      const pages = pdfDoc.getPages();
      let textContent = '';
      
      for (let i = 0; i < pages.length; i++) {
        textContent += `Page ${i + 1}:\n`;
        textContent += `[Text extraction failed - this is a fallback message]\n`;
        textContent += `The PDF contains ${pages.length} page(s) but text extraction encountered an error.\n\n`;
      }
      
      return new Blob([textContent], { type: 'text/plain' });
    }
  }

  private async convertToHTML(pdfDoc: PDFDocument, options: ConversionOptions): Promise<Blob> {
    try {
      const pages = pdfDoc.getPages();
      
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Converted PDF</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .page { page-break-after: always; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
        .page:last-child { border-bottom: none; }
        h2 { color: #333; margin-bottom: 15px; }
        p { line-height: 1.6; margin-bottom: 10px; }
        .page-number { font-size: 12px; color: #666; text-align: right; }
        .page-info { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>`;
      
      // Convert each page to HTML
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        htmlContent += `
    <div class="page">
        <div class="page-number">Page ${i + 1}</div>
        <h2>Page ${i + 1}</h2>
        <div class="page-info">
            <strong>Page Dimensions:</strong> ${Math.round(width)} x ${Math.round(height)} points<br>
            <strong>Total Pages:</strong> ${pages.length}
        </div>
        <p>This PDF contains ${pages.length} page(s) with various content.</p>
        <p>In a full implementation, this would extract the actual text content from the PDF using advanced text extraction libraries.</p>
        <p><em>Note: This is a simplified conversion. For full text extraction, a more advanced PDF processing library would be required.</em></p>
    </div>`;
      }
      
      htmlContent += '\n</body>\n</html>';
      
      return new Blob([htmlContent], { type: 'text/html' });
    } catch (error) {
      console.error('HTML conversion error:', error);
      // Fallback to basic HTML structure
      const pages = pdfDoc.getPages();
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Converted PDF</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .page { page-break-after: always; margin-bottom: 30px; }
        h2 { color: #333; }
        p { line-height: 1.6; }
    </style>
</head>
<body>`;
      
      for (let i = 0; i < pages.length; i++) {
        htmlContent += `
    <div class="page">
        <h2>Page ${i + 1}</h2>
        <p>[HTML conversion failed - this is a fallback message]</p>
        <p>The PDF contains ${pages.length} page(s) but HTML conversion encountered an error.</p>
    </div>`;
      }
      
      htmlContent += '\n</body>\n</html>';
      
      return new Blob([htmlContent], { type: 'text/html' });
    }
  }

  private async convertToDocx(pdfDoc: PDFDocument, options: ConversionOptions): Promise<Blob> {
    try {
      const pages = pdfDoc.getPages();
      const children: any[] = [];
      
      // Add title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Converted PDF Document",
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.TITLE,
        })
      );
      
      // Add document info
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `This document was converted from a PDF containing ${pages.length} page(s).`,
              size: 20,
            }),
          ],
        })
      );
      
      // Convert each page to DOCX
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add page heading
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page ${i + 1}`,
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          })
        );
        
        // Add page information
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Page Dimensions: ${Math.round(width)} x ${Math.round(height)} points`,
                size: 18,
                italics: true,
              }),
            ],
          })
        );
        
        // Add content placeholder
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "This PDF contains various content that would be extracted in a full implementation.",
                size: 20,
              }),
            ],
          })
        );
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "In a full implementation, this would extract the actual text content from the PDF using advanced text extraction libraries.",
                size: 20,
              }),
            ],
          })
        );
        
        // Add page break between pages (except for last page)
        if (i < pages.length - 1) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              pageBreakBefore: true,
            })
          );
        }
      }
      
      // Create DOCX document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });
      
      // Generate DOCX buffer
      const buffer = await Packer.toBuffer(doc);
      
      return new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    } catch (error) {
      console.error('DOCX conversion error:', error);
      // Fallback to simple text-based DOCX
      const pages = pdfDoc.getPages();
      const children: any[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: "Converted PDF Document",
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "[DOCX conversion failed - this is a fallback message]",
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `The PDF contains ${pages.length} page(s) but DOCX conversion encountered an error.`,
              size: 20,
            }),
          ],
        }),
      ];
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });
      
      const buffer = await Packer.toBuffer(doc);
      
      return new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    }
  }

  private async extractImages(pdfDoc: PDFDocument, options: ConversionOptions): Promise<Blob> {
    try {
      const pages = pdfDoc.getPages();
      const zip = new JSZip();
      
      // Create a placeholder image (1x1 transparent PNG)
      const placeholderImageData = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
      const base64Data = placeholderImageData.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Add placeholder images for each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Create a text file with page information
        const pageInfo = `Page ${i + 1} Information:
Dimensions: ${Math.round(width)} x ${Math.round(height)} points
This is a placeholder for image extraction.

In a full implementation, this would extract actual images from the PDF using advanced image extraction libraries.

Note: This simplified implementation cannot extract actual images from the PDF due to Edge Runtime limitations.`;
        
        zip.file(`page_${i + 1}_info.txt`, pageInfo);
        zip.file(`page_${i + 1}_placeholder.png`, imageBuffer);
      }
      
      // Add a summary file
      const summaryText = `PDF Image Extraction Summary

Total Pages: ${pages.length}
Extraction Method: Simplified (Edge Runtime Compatible)

This PDF contains ${pages.length} page(s) but actual image extraction is not available in this simplified implementation.

For full image extraction, the following would be required:
- Advanced PDF processing libraries (pdfjs-dist, pdf2pic, etc.)
- Canvas API support
- More complex image extraction algorithms

Files included:
${Array.from({ length: pages.length }, (_, i) => `- page_${i + 1}_info.txt (page information)
- page_${i + 1}_placeholder.png (placeholder image)`).join('\n')}`;
      
      zip.file('extraction_summary.txt', summaryText);
      
      // Generate ZIP file
      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      
      return new Blob([zipBuffer], { type: 'application/zip' });
    } catch (error) {
      console.error('Image extraction error:', error);
      // Fallback to text-based ZIP
      const pages = pdfDoc.getPages();
      const zip = new JSZip();
      
      const errorText = `Image extraction failed
      
This PDF contains ${pages.length} page(s) but image extraction encountered an error.

Possible reasons:
- Images are embedded in a complex format
- PDF uses advanced compression
- Images are part of the page content rather than separate objects
- Edge Runtime limitations prevent advanced image processing

Page breakdown:
${Array.from({ length: pages.length }, (_, i) => `- Page ${i + 1}`).join('\n')}`;
      
      zip.file('extraction_error.txt', errorText);
      
      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      
      return new Blob([zipBuffer], { type: 'application/zip' });
    }
  }

  async analyzePDF(file: File): Promise<{
    pageCount: number;
    size: number;
    textContent: boolean;
    images: boolean;
    recommendedFormats: string[];
    estimatedProcessingTime: number;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const pageCount = pdfDoc.getPageCount();
      const size = file.size;
      
      // Estimate processing time
      const estimatedTime = pageCount * 2 + (size / (1024 * 1024)) * 0.5; // seconds
      
      // Determine recommended formats based on document characteristics
      const recommendedFormats = ['txt', 'html'];
      
      if (pageCount > 5) {
        recommendedFormats.push('docx');
      }
      
      if (size > 1024 * 1024) { // > 1MB
        recommendedFormats.push('images');
      }

      return {
        pageCount,
        size,
        textContent: true,
        images: true,
        recommendedFormats,
        estimatedProcessingTime: Math.round(estimatedTime),
      };
    } catch (error) {
      throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async batchConvert(files: File[], options: ConversionOptions): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.convertPDF(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        // Add a failed result
        results.push({
          convertedFile: new Blob(['Conversion failed']),
          originalSize: file.size,
          convertedSize: 0,
          format: options.format,
          processingTime: 0,
          settings: options,
        });
      }
    }
    
    return results;
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatProcessingTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF' };
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 50MB' };
    }
    
    return { valid: true };
  }
}