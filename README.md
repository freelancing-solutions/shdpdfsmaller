# PDFSmaller Advanced

A comprehensive PDF processing suite built with Next.js 15, TypeScript, and modern web technologies. This advanced PDF tool offers compression, conversion, OCR, AI-powered analysis, and file management capabilities.

## Features

### 🗜️ PDF Compression
- **Client-side processing**: Compress PDFs directly in the browser
- **Multiple compression levels**: Low, Medium, High, and Maximum compression
- **Image quality control**: Adjustable image quality settings (10-100%)
- **Real-time analysis**: Instant file analysis with compression estimates
- **Batch processing**: Compress multiple files simultaneously

### 🔄 PDF Conversion
- **Multiple output formats**: Convert to DOCX, TXT, HTML, or Images
- **Quality settings**: Low, Medium, and High quality options
- **Format preservation**: Optional formatting preservation
- **Image extraction**: Extract images from PDFs
- **Batch conversion**: Process multiple files at once

### 👁️ OCR (Optical Character Recognition)
- **Multi-language support**: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean
- **Multiple output formats**: Plain text, annotated PDF, Word document, searchable PDF
- **Confidence control**: Adjustable OCR confidence levels (50-100%)
- **Layout preservation**: Option to preserve original document layout
- **Batch processing**: Process multiple documents simultaneously

### 🤖 AI Tools
- **Document summarization**: Generate basic, detailed, or comprehensive summaries
- **Translation**: Translate documents to 10 different languages
- **Keyword extraction**: Extract key terms and phrases
- **Sentiment analysis**: Analyze document sentiment and confidence
- **Question generation**: Generate questions from document content
- **Document categorization**: Automatically categorize documents by type

### 📁 File Manager
- **Centralized storage**: Manage all processed files in one place
- **Search functionality**: Quick search through stored files
- **Storage analytics**: Monitor storage usage and file statistics
- **File organization**: Categorize files by processing type
- **Download management**: Easy download of processed files
- **Bulk operations**: Clear all files or manage individually

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Framework**: React 19 with Tailwind CSS 4
- **Components**: shadcn/ui component library
- **PDF Processing**: PDF-lib for client-side PDF manipulation
- **State Management**: React hooks with local state management
- **Icons**: Lucide React icons
- **Development**: ESLint, Prettier, TypeScript

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pdfsmaller-advanced.git
   cd pdfsmaller-advanced
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # PDF analysis API
│   │   ├── compress/route.ts         # PDF compression API
│   │   ├── convert/route.ts          # PDF conversion API
│   │   ├── ocr/route.ts             # OCR processing API
│   │   ├── ai-tools/route.ts        # AI tools API
│   │   └── files/route.ts           # File manager API
│   ├── page.tsx                     # Main application page
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Global styles
├── components/
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── pdf-compression.ts           # PDF compression service
│   ├── pdf-conversion.ts            # PDF conversion service
│   ├── pdf-ocr.ts                  # OCR processing service
│   ├── pdf-ai-tools.ts             # AI tools service
│   ├── file-manager.ts             # File management service
│   └── utils.ts                    # Utility functions
└── hooks/
    ├── use-mobile.ts               # Mobile detection hook
    └── use-toast.ts                # Toast notification hook
```

## API Endpoints

### PDF Analysis
- `POST /api/analyze` - Analyze PDF for compression potential
- `GET /api/analyze` - API information

### PDF Compression
- `POST /api/compress` - Compress PDF files
- `GET /api/compress` - API information

### PDF Conversion
- `POST /api/convert` - Convert PDF to other formats
- `GET /api/convert` - API information

### OCR Processing
- `POST /api/ocr` - Process OCR on PDF files
- `GET /api/ocr` - API information

### AI Tools
- `POST /api/ai-tools` - Process PDF with AI tools
- `GET /api/ai-tools` - API information

### File Manager
- `GET /api/files?action=list` - List stored files
- `GET /api/files?action=storage` - Get storage info
- `GET /api/files?action=download&fileId={id}` - Download file
- `POST /api/files` - Upload file
- `DELETE /api/files?fileId={id}` - Delete file
- `DELETE /api/files?action=clear` - Clear all files

## Usage Examples

### PDF Compression
```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('compressionLevel', 'medium');
formData.append('imageQuality', '80');

const response = await fetch('/api/compress', {
  method: 'POST',
  body: formData,
});

const compressedBlob = await response.blob();
```

### PDF Conversion
```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('format', 'docx');
formData.append('quality', 'high');
formData.append('preserveFormatting', 'true');

const response = await fetch('/api/convert', {
  method: 'POST',
  body: formData,
});

const convertedBlob = await response.blob();
```

### OCR Processing
```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('language', 'en');
formData.append('outputFormat', 'txt');
formData.append('confidence', '85');

const response = await fetch('/api/ocr', {
  method: 'POST',
  body: formData,
});

const processedBlob = await response.blob();
```

### AI Tools
```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('tool', 'summarize');
formData.append('detailLevel', 'detailed');

const response = await fetch('/api/ai-tools', {
  method: 'POST',
  body: formData,
});

const resultBlob = await response.blob();
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **File size limit**: 50MB per file
- **Client-side processing**: All PDF processing happens in the browser
- **Memory usage**: Large files may require significant memory
- **Processing time**: Varies based on file size and complexity

## Security Features

- **Client-side processing**: Files never leave the user's browser for compression
- **No server uploads**: Optional server processing only when explicitly chosen
- **Local storage**: File management uses browser's local storage
- **Input validation**: All file inputs are validated before processing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate Prisma client

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for functions and classes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [PDF-lib](https://pdf-lib.js.org/) for PDF manipulation
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
- [Next.js](https://nextjs.org/) for the React framework

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**PDFSmaller Advanced** - A comprehensive PDF processing solution for the modern web.