# API Refactoring TODO

This document outlines the refactoring plan for standardizing API routes to use the utility functions provided in `src/lib/api-utils.ts`. The goal is to create a consistent and maintainable approach for handling file uploads, validation, and responses across all backend services.

The `src/app/api/compress/route.ts` service should be used as the primary reference for this refactoring effort once it has been updated.

## Core Principles

1.  **Centralized File Handling**: All API routes that handle file uploads (`multipart/form-data`) MUST use `APIFileHandler.parseFormData` from `src/lib/api-utils.ts` to extract and validate files and parameters.
2.  **Standardized Validation**: All parameter validation (e.g., compression level, output format) MUST use the validation helpers from `APIFileHandler` (`validateParam`, `validateNumericParam`, `validateBooleanParam`).
3.  **Consistent Responses**: All success and error responses MUST be generated using `APIFileHandler.createFileResponse` and `APIFileHandler.createErrorResponse`, respectively.
4.  **Remove Redundancy**: Redundant, route-specific helper functions for validation and parsing MUST be removed.

## Refactoring Checklist

### 1. Refactor `src/app/api/compress/route.ts` (High Priority)

-   [ ] Replace the local `validateFile` function with calls to `APIFileHandler.validateFile` or rely on the validation within `APIFileHandler.parseFormData`.
-   [ ] Replace the local `validateCompressionOptions` function with `APIFileHandler.validateParam` and `APIFileHandler.validateNumericParam`.
-   [ ] In `handleSingleCompression` and `handleBulkCompression`, replace manual `request.formData()` parsing with a single call to `APIFileHandler.parseFormData`.
-   [ ] Refactor `handleSingleCompression` and `handleBulkCompression` to use `APIFileHandler.createFileResponse` for sending back the processed file.
-   [ ] Replace all `NextResponse.json({ error: ... })` with `APIFileHandler.createErrorResponse`.

### 2. Refactor `src/app/api/convert/route.ts`

-   [ ] Apply the same refactoring pattern from the `compress` route.
-   [ ] Use `APIFileHandler.parseFormData` to handle the uploaded PDF file.
-   [ ] Use `APIFileHandler.validateParam` to validate the `outputFormat` parameter.
-   [ ] Use `APIFileHandler` for creating all responses.

### 3. Refactor `src/app/api/ocr/route.ts`

-   [ ] Apply the same refactoring pattern.
-   [ ] Use `APIFileHandler.parseFormData` to handle the uploaded PDF file.
-   [ ] Use `APIFileHandler.validateParam` and other validators for OCR options (e.g., language, output format).
-   [ ] Use `APIFileHandler` for creating all responses.

### 4. Refactor `src/app/api/ai-tools/route.ts`

-   [ ] Apply the same refactoring pattern.
-   [ ] Use `APIFileHandler.parseFormData` to handle the uploaded PDF file.
-   [ ] Use `APIFileHandler.validateParam` for the `tool` parameter (e.g., 'summarize', 'translate').
-   [ ] Use `APIFileHandler` for creating all responses.

### 5. Refactor `src/app/api/analyze/route.ts`

-   [ ] Apply the same refactoring pattern.
-   [ ] Use `APIFileHandler.parseFormData` to handle the uploaded PDF file for analysis.
-   [ ] Use `APIFileHandler` for creating all responses.

## Frontend `api-client.ts`

The frontend `APIClient` in `src/utils/api-client.ts` is the client-side counterpart to the backend API. It should be used for all interactions with the API routes. Ensure that it correctly constructs `FormData` objects that the refactored backend routes expect.
