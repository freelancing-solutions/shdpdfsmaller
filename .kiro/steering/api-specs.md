# API Specifications & Standards

## Overview

All PDF processing APIs follow a standardized pattern using `multipart/form-data` requests and consistent response formats. Reference the complete API documentation in the `docs/` folder for detailed specifications.

## Standard Request Format

All APIs accept `multipart/form-data` POST requests with:
- File upload fields: `file` (single) or `files` (multiple)
- Parameter fields: Various string/number parameters specific to each API
- Content-Type: `multipart/form-data` (automatically set by browsers/clients)

## Standard Response Format

### Success Responses
- **File responses**: Binary content with appropriate Content-Type
- **JSON responses**: `{ success: true, data: any, timestamp: string }`
- **Headers**: Processing metadata with `X-` prefix

### Error Responses
- **Status codes**: 400 (Bad Request), 500 (Internal Server Error)
- **Format**: `{ success: false, error: string, timestamp: string }`
- **Content-Type**: `application/json`

## API Endpoints

### 1. PDF Compression (`POST /api/compress`)
**Purpose**: Reduce PDF file size with configurable compression levels

**Parameters**:
- `file` (File, required): Single PDF file
- `files` (File[], alternative): Multiple PDF files for batch processing
- `compressionLevel` (string, default: "medium"): low | medium | high | maximum
- `imageQuality` (number, default: 75): 10-100, image quality percentage

**Response**: Compressed PDF file or ZIP archive (batch)
**Headers**: `X-Original-Size`, `X-Compressed-Size`, `X-Reduction-Percent`

### 2. PDF Conversion (`POST /api/convert`)
**Purpose**: Convert PDF to other formats (DOCX, TXT, HTML, Images)

**Parameters**:
- `file` (File, required): PDF file to convert
- `format` (string, required): docx | txt | html | images
- `quality` (string, default: "medium"): low | medium | high
- `preserveFormatting` (boolean, default: true): Maintain original layout
- `extractImages` (boolean, default: false): Extract images to ZIP

**Response**: Converted file in requested format
**Headers**: `X-Original-Size`, `X-Converted-Size`, `X-Conversion-Format`, `X-Processing-Time`

### 3. OCR Processing (`POST /api/ocr`)
**Purpose**: Extract text from PDF using optical character recognition

**Parameters**:
- `file` (File, required): PDF file to process
- `language` (string, required): en | es | fr | de | it | pt | ru | zh | ja | ko
- `outputFormat` (string, required): txt | pdf | docx | searchable-pdf
- `preserveLayout` (boolean, default: false): Maintain visual layout
- `confidence` (number, default: 95): 50-100, minimum OCR confidence

**Response**: Text file or processed PDF/DOCX
**Headers**: `X-Original-Size`, `X-Processed-Size`, `X-OCR-Confidence`, `X-Processing-Time`

### 4. AI Tools (`POST /api/ai-tools`)
**Purpose**: AI-powered document analysis and transformation

**Parameters**:
- `file` (File, required): PDF file to analyze
- `tool` (string, required): summarize | translate | extract-keywords | analyze-sentiment | generate-questions | categorize
- `detailLevel` (string, default: "basic"): basic | detailed | comprehensive (for summarize)
- `maxLength` (number, default: 1000): 100-10000, output length limit (for summarize)
- `targetLanguage` (string, required for translate): en | es | fr | de | it | pt | ru | zh | ja | ko

**Response**: Plain text file with AI analysis results
**Headers**: `X-AI-Tool`, `X-Processing-Time`, `X-Detail-Level`

## Parameter Validation Standards

### File Validation
- PDF magic number check (%PDF-) for security
- File size limits based on subscription tier
- Empty file detection
- MIME type validation with fallback to extension

### String Parameters
- Enum validation with clear error messages listing valid options
- Case-insensitive comparison where appropriate
- Default value handling

### Numeric Parameters
- Range validation with min/max bounds
- Integer parsing with NaN detection
- Default value assignment

### Boolean Parameters
- Accept "true"/"false" strings or "1"/"0"
- Default to false if not provided
- Case-insensitive parsing

## Error Handling Standards

### Common Error Messages
- "No file provided. Please upload a PDF file."
- "File is not a valid PDF. Header signature is missing."
- "File size ({size}) exceeds {limit}MB limit"
- "Invalid {parameter}. Valid options: {options}"
- "{parameter} must be between {min} and {max}"

### Error Response Structure
```json
{
  "success": false,
  "error": "Descriptive error message",
  "timestamp": "2025-09-02T10:00:00.000Z"
}
```

## Response Headers Standards

### Processing Metadata
- `X-Original-Size`: Original file size in bytes
- `X-Processed-Size` / `X-Compressed-Size` / `X-Converted-Size`: Output file size
- `X-Processing-Time`: Processing duration in milliseconds
- `X-Reduction-Percent`: Compression percentage (compression API)
- `X-OCR-Confidence`: Average OCR confidence (OCR API)
- `X-AI-Tool`: AI tool used (AI tools API)
- `X-Detail-Level`: Detail level setting (AI tools API)

### File Download Headers
- `Content-Type`: Appropriate MIME type for output format
- `Content-Disposition`: `attachment; filename="{filename}"`
- `Access-Control-Allow-Origin`: `*` (for CORS)
- `Access-Control-Expose-Headers`: List of custom X- headers

## Testing Standards

### curl Examples
Each API should provide curl examples for:
- Basic usage with required parameters
- Advanced usage with optional parameters
- Error scenarios for testing validation

### Response Validation
- Verify appropriate Content-Type headers
- Check for required processing metadata headers
- Validate file output integrity
- Test error response format consistency