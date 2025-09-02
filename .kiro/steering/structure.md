# Project Structure & Organization

## Root Directory Structure

```
├── .kiro/                    # Kiro IDE configuration and steering rules
├── docs/                     # API documentation (compression, conversion, OCR, AI tools)
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets (logo, robots.txt)
├── src/                      # Source code (see detailed structure below)
├── db/                       # Local database files
├── server.ts                 # Custom server with Socket.IO integration
└── package.json              # Dependencies and scripts
```

## Source Code Structure (`src/`)

### Application Routes (`src/app/`)
```
src/app/
├── api/                      # API routes (Next.js App Router)
│   ├── auth/                 # Authentication endpoints
│   ├── compress/             # PDF compression API
│   ├── convert/              # PDF conversion API  
│   ├── ocr/                  # OCR processing API
│   ├── ai-tools/             # AI-powered document analysis
│   ├── files/                # File management API
│   ├── payments/             # PayPal payment processing
│   └── subscriptions/        # Subscription management
├── page.tsx                  # Main application page
├── layout.tsx                # Root layout component
└── globals.css               # Global styles
```

### Components (`src/components/`)
```
src/components/
├── auth/                     # Authentication-related components
├── layout/                   # Layout and navigation components
├── subscription/             # Billing and subscription components
└── ui/                       # shadcn/ui reusable components
```

### Business Logic (`src/lib/`)
```
src/lib/
├── api-utils.ts              # APIFileHandler utility class (REQUIRED for all file APIs)
├── auth.ts                   # Authentication utilities and JWT handling
├── db.ts                     # Database connection and utilities
├── paypal.ts                 # PayPal integration and payment processing
├── file-manager.ts           # File storage and management
├── pdf-compression.ts        # PDF compression service
├── pdf-conversion.ts         # PDF conversion service
├── pdf-ocr.ts               # OCR processing service
├── pdf-ai-tools.ts          # AI tools service
├── socket.ts                # Socket.IO setup and handlers
└── utils.ts                 # General utility functions
```

### Client Utilities (`src/utils/`)
```
src/utils/
└── api-client.ts            # APIClient service (REQUIRED for frontend API calls)
```

### React Hooks (`src/hooks/`)
```
src/hooks/
├── use-mobile.ts            # Mobile device detection
├── use-toast.ts             # Toast notification management
└── useUser.ts               # User authentication state
```

### State Management (`src/store/`)
```
src/store/
└── tab-store.ts             # Zustand store for tab management
```

## Naming Conventions

### Files and Directories
- Use kebab-case for file names: `pdf-compression.ts`, `api-utils.ts`
- Use PascalCase for React components: `AuthForm.tsx`, `SubscriptionCard.tsx`
- API routes follow Next.js App Router conventions: `route.ts`

### Code Structure
- Utility classes use PascalCase: `APIFileHandler`, `APIClient`
- Functions use camelCase: `validateFile`, `compressFiles`
- Constants use UPPER_SNAKE_CASE: `DEFAULT_MAX_SIZE`, `ALLOWED_TYPES`

## Key Architecture Rules

### API Development
1. All file upload APIs MUST extend from the reference implementation in `src/app/api/compress/route.ts`
2. Use `APIFileHandler` for consistent file parsing and validation
3. Return standardized responses using `APIFileHandler.createFileResponse()` or `APIFileHandler.createErrorResponse()`
4. All APIs MUST accept `multipart/form-data` requests
5. Include processing metadata in response headers with `X-` prefix
6. Follow parameter naming conventions from existing APIs

### API Parameter Standards
- **File fields**: Use `file` for single files, `files` for multiple files
- **Quality settings**: Use consistent options (low/medium/high) across APIs
- **Boolean parameters**: Accept string values "true"/"false" or "1"/"0"
- **Numeric ranges**: Validate and document min/max values (e.g., confidence: 50-100)
- **Enum parameters**: Provide clear valid options lists in error messages

### Frontend Development  
1. All API calls MUST use the `APIClient` service from `src/utils/api-client.ts`
2. Components should be organized by feature in `src/components/`
3. Use shadcn/ui components from `src/components/ui/` for consistency
4. Handle file validation client-side before API calls
5. Extract and display processing metadata from response headers

### Database
- Prisma schema in `prisma/schema.prisma` defines all models
- Use Prisma Client for all database operations
- Database utilities centralized in `src/lib/db.ts`

### Authentication
- JWT tokens stored in HTTP-only cookies
- User verification handled by `verifyAuth` function in `src/lib/auth.ts`
- Subscription tier enforcement in API middleware

## Documentation Standards
- API specifications in `docs/` directory with detailed examples
- Each API endpoint documented with request/response formats
- Include curl examples for testing
- Document all parameters with types, defaults, and valid options
- Specify response headers and their meanings
- Provide error message examples