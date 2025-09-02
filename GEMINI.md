## Important Note

The `src/app/api` directory contains all the backend code for this application. It is not part of the frontend and should be treated as a separate server-side application.

## Project Overview

This is a Next.js 15 application called "PDFSmaller Advanced", a comprehensive PDF processing suite. It provides features like PDF compression, conversion, OCR, and AI-powered analysis. The application has a tiered access system (Guest, Free, Pro, Enterprise) with usage-based limitations.

## Technology Stack

*   **Frontend**: Next.js 15, React 19, TypeScript
*   **UI**: Tailwind CSS 4, shadcn/ui
*   **Authentication**: NextAuth.js (JWT)
*   **State Management**: React hooks, Zustand (`useTabStore`)
*   **PDF Processing**: Server-side with custom algorithms
*   **Payments**: PayPal
*   **Rate Limiting**: Upstash Redis
*   **Database**: PostgreSQL with Prisma ORM
*   **Icons**: Lucide React
*   **Linting/Formatting**: ESLint, Prettier

## Available Scripts

*   `npm run dev`: Start development server.
*   `npm run build`: Build for production.
*   `npm run start`: Start production server.
*   `npm run lint`: Run ESLint.
*   `npm run db:push`: Push database schema changes.
*   `npm run db:generate`: Generate Prisma client.
*   `npm run db:studio`: Open Prisma Studio.

## Frontend Overview

The main frontend component is `src/app/page.tsx`, which serves as the main user interface for the application. It uses a tabbed layout to provide access to the different features.

*   **State Management**: The frontend uses React hooks (`useState`, `useCallback`) for component-level state management. For global state, it uses Zustand for the active tab (`useTabStore`) and a custom hook `useUser` for user session management.
*   **File Handling**: Each feature (Compress, Convert, OCR, AI Tools) has its own state for managing files. The `APIClient` (`src/utils/api-client.ts`) is used to handle all communication with the backend API, including file uploads, processing, and downloads.
*   **UI Components**: The UI is built using `shadcn/ui` components, which are located in `src/components/ui`. Application-specific components are in `src/components/auth`, `src/components/layout`, and `src/components/subscription`.

## Backend Overview

The backend is built using Next.js API routes and is located in the `src/app/api` directory.

### API Development Standard

To ensure consistency and maintainability, all API routes that handle file uploads and data processing must adhere to a standardized architecture.

*   **Backend (`src/lib/api-utils.ts`)**: All API routes MUST use the `APIFileHandler` class from `src/lib/api-utils.ts`. This utility provides standardized methods for parsing `multipart/form-data`, validating files and parameters, and creating consistent success and error responses. This approach centralizes file handling logic and removes redundant code from individual route handlers.

*   **Frontend (`src/utils/api-client.ts`)**: The `APIClient` class in `src/utils/api-client.ts` is the designated tool for all frontend-to-backend communication. It is designed to work seamlessly with the backend API standards, simplifying file uploads and data submission from the client.

The `src/app/api/compress/route.ts` service is the reference implementation for this standard. All other file-processing API routes (e.g., `convert`, `ocr`, `ai-tools`) are being refactored to follow this same pattern.

### API Routes

*   `POST /api/ai-tools`: Process PDF with AI tools (summarize, translate, etc.). Uses `PDFAIToolsService`.
*   `POST /api/analyze`: Analyze a PDF file for compression potential. Uses `PDFCompressionService`.
*   `POST /api/compress`: Compress a single or multiple PDF files. Uses `PDFCompressionService`.
*   `POST /api/convert`: Convert PDF to other formats (docx, txt, html, images). Uses `PDFConversionService`.
*   `POST /api/ocr`: Process OCR on a PDF file. Uses `PDFOCRService`.
*   `GET, POST, DELETE /api/files`: Manage files (list, upload, download, delete). Uses `ServerFileManagerService`.

### Core Services (`src/lib`)

*   `pdf-ai-tools.ts`: Handles all AI-related processing of PDFs.
*   `pdf-compression.ts`: Handles PDF compression and analysis.
*   `pdf-conversion.ts`: Handles PDF conversion to other formats.
*   `pdf-ocr.ts`: Handles OCR processing of PDFs.
*   `server-file-manager.ts`: Manages file storage and retrieval.
*   `api-utils.ts`: Provides utility functions for the API routes.
*   `auth.ts`: Authentication utilities.
*   `paypal.ts`: PayPal integration.
*   `rate-limiting.ts`: Rate limiting service.
*   `subscription.ts`: Subscription management.