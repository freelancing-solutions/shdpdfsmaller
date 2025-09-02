# Technology Stack & Build System

## Core Technologies

- **Frontend**: Next.js 15 with TypeScript and React 19
- **UI Framework**: Tailwind CSS 4 with shadcn/ui components
- **Authentication**: NextAuth.js with JWT tokens and custom auth utilities
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: PayPal integration with webhook handling
- **Rate Limiting**: Upstash Redis for request throttling
- **Real-time**: Socket.IO integration with custom server
- **State Management**: React hooks with Zustand for global state
- **Icons**: Lucide React icons

## Development Tools

- **Language**: TypeScript with strict mode enabled
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm with package-lock.json
- **Development Server**: Custom server with nodemon and tsx
- **Database Tools**: Prisma CLI for migrations and schema management

## Common Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production (includes Prisma generate)
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database (development only)
```

## Architecture Patterns

### API Architecture
- All API routes processing file uploads MUST use `APIFileHandler` utility class from `src/lib/api-utils.ts`
- Frontend components MUST use `APIClient` service from `src/utils/api-client.ts`
- Standardized error handling and response formats across all endpoints
- File validation with magic number checking for PDFs
- All APIs use `multipart/form-data` for file uploads
- Consistent response headers with `X-` prefixed metadata (processing time, file sizes, etc.)
- Standard error response format: `{ success: false, error: string, timestamp: string }`

### API Endpoints & Parameters
- **Compression API** (`/api/compress`): `compressionLevel` (low/medium/high/maximum), `imageQuality` (10-100)
- **Conversion API** (`/api/convert`): `format` (docx/txt/html/images), `quality` (low/medium/high), `preserveFormatting`, `extractImages`
- **OCR API** (`/api/ocr`): `language` (en/es/fr/de/it/pt/ru/zh/ja/ko), `outputFormat` (txt/pdf/docx/searchable-pdf), `preserveLayout`, `confidence` (50-100)
- **AI Tools API** (`/api/ai-tools`): `tool` (summarize/translate/extract-keywords/analyze-sentiment/generate-questions/categorize), `detailLevel` (basic/detailed/comprehensive), `maxLength` (100-10000), `targetLanguage`

### Authentication
- JWT-based authentication with cookie storage
- Role-based access control with subscription tier enforcement
- Rate limiting based on user subscription level
- Guest access with session-based restrictions

### File Processing
- Server-side PDF processing for security and performance
- Standardized file validation and error handling
- Metadata extraction and response headers for processing information
- Support for both single file and batch operations
- PDF magic number validation (%PDF-) for security
- File size limits enforced by subscription tier

## Configuration Files

- `next.config.ts`: Next.js configuration with TypeScript support
- `tailwind.config.ts`: Tailwind CSS configuration with custom theme
- `tsconfig.json`: TypeScript configuration with path aliases
- `prisma/schema.prisma`: Database schema definition
- `server.ts`: Custom server with Socket.IO integration